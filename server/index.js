import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';
import { pipeline } from '@xenova/transformers';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';

// Import User Model
import User from './models/User.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b';

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing in your .env file!");
} else {
    mongoose
        .connect(MONGO_URI)
        .then(() => console.log(' Connected to MongoDB Atlas Successfully!'))
        .catch((err) => console.error(' MongoDB Connection Error:', err));
}

// Inline Chat Schema for MongoDB Storage
const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    chatId: { type: String, required: true },
    title: { type: String, default: "New Conversation" },
    messages: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
});
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

const upload = multer({ storage: multer.memoryStorage() });

let embedder = null;

// Store vectors & active documents per chat session
let vectorDocs = {};
let activeFiles = {};

// SEMANTIC CACHE STORE (Vector Cache for <20ms fast responses)
let semanticCache = [];

const originalWarn = console.warn;
console.warn = function (...args) {
    if (typeof args[0] === 'string' && args[0].includes('TT: undefined function')) {
        return;
    }
    originalWarn.apply(console, args);
};

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

async function generateEmbedding(text) {
    const extractor = await getEmbedder();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

// Multi-Format File Text Extractor
async function parseFileContent(file) {
    const mime = file.mimetype;
    const originalName = file.originalname.toLowerCase();

    if (mime === 'application/pdf' || originalName.endsWith('.pdf')) {
        const pagesData = [];
        const parsedPdf = await pdfParse(file.buffer, {
            pagerender: function (pageData) {
                return pageData.getTextContent().then(function (textContent) {
                    let lastY, text = '';
                    for (let item of textContent.items) {
                        if (lastY == item.transform[4] || !lastY) {
                            text += item.str;
                        } else {
                            text += '\n' + item.str;
                        }
                        lastY = item.transform[4];
                    }
                    pagesData.push({ page: pageData.pageIndex + 1, text });
                    return text;
                });
            },
        });
        return { isPaged: true, pages: pagesData, rawText: parsedPdf.text };
    }

    if (originalName.endsWith('.docx') || mime.includes('wordprocessingml')) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return { isPaged: false, rawText: result.value };
    }

    if (originalName.endsWith('.pptx') || originalName.endsWith('.ppt')) {
        const text = await officeParser.parseOfficeAsync(file.buffer);
        return { isPaged: false, rawText: text };
    }

    if (originalName.endsWith('.csv') || mime === 'text/csv') {
        const csvStr = file.buffer.toString('utf-8');
        const parsed = Papa.parse(csvStr, { header: true });
        const rawText = JSON.stringify(parsed.data, null, 2);
        return { isPaged: false, rawText };
    }

    if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        let combinedText = '';
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            combinedText += `--- Sheet: ${sheetName} ---\n` + XLSX.utils.sheet_to_csv(sheet) + '\n';
        });
        return { isPaged: false, rawText: combinedText };
    }

    return { isPaged: false, rawText: file.buffer.toString('utf-8') };
}

// PERSONA SYSTEM PROMPTS MAP
const PERSONA_PROMPTS = {
    default:
        'You are QueryBot, an intelligent study and general AI assistant. Answer user questions accurately, logically, and clearly.',
    tutor:
        'You are an Academic Tutor 🎓. Simplify complex concepts step-by-step using plain-language analogies, bulleted revision points, and clear definitions tailored for exam preparation.',
    coder:
        'You are a Senior Code Reviewer 💻. Focus on code quality, performance optimizations, clean architecture, and bug detection. Always output clean, executable code snippets enclosed in Markdown code blocks alongside concise line-by-line explanations.',
    summarizer:
        'You are an Executive Summarizer 📝. Be extremely concise and direct. Do not include conversational greetings or fluff. Respond strictly in high-level key takeaways and bullet points.',
};

// AUTH ENDPOINTS
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'An account with this email exists.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name && name.trim() ? name.trim() : email.split('@')[0],
            email,
            password: hashedPassword,
        });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ success: true, token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error during signup.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// MONGODB CHAT MANAGEMENT ENDPOINTS
app.get('/api/chats/:userId', async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
        res.json({ chats });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user chats' });
    }
});

app.post('/api/chats/save', async (req, res) => {
    try {
        const { userId, chatId, title, messages } = req.body;
        if (!userId || !chatId) return res.status(400).json({ error: 'User ID and Chat ID required' });

        await Chat.findOneAndUpdate(
            { userId, chatId },
            { title, messages, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save chat' });
    }
});

app.delete('/api/chats/:userId/:chatId', async (req, res) => {
    try {
        const { userId, chatId } = req.params;
        await Chat.deleteOne({ userId, chatId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// MULTI-FORMAT FILE UPLOAD ENDPOINT
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const chatId = String(req.body.chatId || 'default');

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = req.file.originalname;
        const parsedResult = await parseFileContent(req.file);

        if (!parsedResult.rawText || !parsedResult.rawText.trim()) {
            return res.status(400).json({ error: 'No readable text found in document.' });
        }

        if (!vectorDocs[chatId]) vectorDocs[chatId] = [];
        if (!activeFiles[chatId]) activeFiles[chatId] = [];

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1200,
            chunkOverlap: 250,
        });

        if (parsedResult.isPaged && parsedResult.pages) {
            for (const pageObj of parsedResult.pages) {
                if (!pageObj.text.trim()) continue;
                const docs = await textSplitter.createDocuments([pageObj.text]);
                for (const doc of docs) {
                    const vector = await generateEmbedding(doc.pageContent);
                    vectorDocs[chatId].push({
                        content: doc.pageContent,
                        vector,
                        source: fileName,
                        page: pageObj.page,
                    });
                }
            }
        } else {
            const docs = await textSplitter.createDocuments([parsedResult.rawText]);
            for (const doc of docs) {
                const vector = await generateEmbedding(doc.pageContent);
                vectorDocs[chatId].push({
                    content: doc.pageContent,
                    vector,
                    source: fileName,
                    page: null,
                });
            }
        }

        const existingFileIndex = activeFiles[chatId].findIndex((f) => f.fileName === fileName);
        if (existingFileIndex === -1) {
            activeFiles[chatId].push({
                fileName,
                fileType: req.file.mimetype,
                uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
        }

        res.json({
            success: true,
            message: 'Document ingested successfully!',
            sampleText: parsedResult.rawText.slice(0, 3000),
            chatId,
            activeFiles: activeFiles[chatId],
        });
    } catch (error) {
        console.error('Ingest Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process document' });
    }
});

// WEB SCRAPING ENDPOINT
app.post('/api/scrape-url', async (req, res) => {
    try {
        const { url, chatId = 'default' } = req.body;
        const targetChatId = String(chatId);

        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ error: 'Please enter a valid HTTP/HTTPS URL.' });
        }

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });

        if (!response.ok) throw new Error(`Failed to fetch web page (${response.status})`);

        const html = await response.text();
        const $ = cheerio.load(html);

        $('script, style, nav, footer, iframe, noscript').remove();
        const pageTitle = $('title').text().trim() || url;
        const scrapedText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!scrapedText || scrapedText.length < 50) {
            return res.status(400).json({ error: 'Could not extract readable text from web page.' });
        }

        if (!vectorDocs[targetChatId]) vectorDocs[targetChatId] = [];
        if (!activeFiles[targetChatId]) activeFiles[targetChatId] = [];

        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1200, chunkOverlap: 250 });
        const docs = await textSplitter.createDocuments([scrapedText]);

        for (const doc of docs) {
            const vector = await generateEmbedding(doc.pageContent);
            vectorDocs[targetChatId].push({
                content: doc.pageContent,
                vector,
                source: pageTitle,
                page: null,
            });
        }

        const sourceName = `🌐 ${pageTitle.slice(0, 25)}...`;
        activeFiles[targetChatId].push({
            fileName: sourceName,
            fileType: 'url',
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        res.json({
            success: true,
            message: 'Web page scraped successfully!',
            sampleText: scrapedText.slice(0, 3000),
            sourceName,
            activeFiles: activeFiles[targetChatId],
        });
    } catch (error) {
        console.error('URL Scrape Error:', error);
        res.status(500).json({ error: error.message || 'Failed to scrape URL.' });
    }
});

// FETCH ACTIVE FILES
app.get('/api/files/:chatId', (req, res) => {
    const chatId = String(req.params.chatId);
    res.json({ files: activeFiles[chatId] || [] });
});

// DELETE INDIVIDUAL FILE
app.delete('/api/files/:chatId/:fileName', (req, res) => {
    const chatId = String(req.params.chatId);
    const fileName = decodeURIComponent(req.params.fileName);

    if (vectorDocs[chatId]) {
        vectorDocs[chatId] = vectorDocs[chatId].filter((doc) => doc.source !== fileName);
    }
    if (activeFiles[chatId]) {
        activeFiles[chatId] = activeFiles[chatId].filter((f) => f.fileName !== fileName);
    }

    res.json({ success: true, activeFiles: activeFiles[chatId] || [] });
});

// AUTO-SUMMARIZE ENDPOINT
app.post('/api/summarize', async (req, res) => {
    try {
        const { sampleText } = req.body;
        if (!sampleText) return res.status(400).json({ error: 'No text provided for summarization.' });

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert academic assistant. Provide a clear, structured summary of the document excerpt below. Highlight 3 key takeaways and 3 core topics covered.',
                    },
                    { role: 'user', content: sampleText },
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || 'Failed to generate summary');

        res.json({ summary: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to generate summary' });
    }
});

// RAG CHAT ENDPOINT WITH COMPARISON & SEMANTIC CACHING
app.post('/api/chat', async (req, res) => {
    try {
        const {
            question,
            chatId = 'default',
            persona = 'default',
            docA = null,
            docB = null,
            isComparisonMode = false,
        } = req.body;

        const targetChatId = String(chatId);
        const chatDocs = vectorDocs[targetChatId] || vectorDocs['default'] || [];

        // 1. SEMANTIC CACHE LOOKUP (<20ms Fast Response)
        const questionVector = await generateEmbedding(question);

        if (!isComparisonMode && semanticCache.length > 0) {
            for (const cached of semanticCache) {
                const similarity = cosineSimilarity(questionVector, cached.questionVector);
                if (similarity >= 0.95) {
                    console.log(`⚡ [Semantic Cache Hit] Cosine Similarity: ${similarity.toFixed(4)}`);
                    return res.json({
                        answer: cached.answer,
                        followups: cached.followups,
                        citations: cached.citations,
                        cached: true,
                    });
                }
            }
        }

        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const personaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.default;
        let systemPrompt = `${personaPrompt} Today's date is ${currentDate}.`;

        let context = '';
        let citations = [];

        // 2. DUAL-DOCUMENT COMPARISON PIPELINE
        if (isComparisonMode && docA && docB) {
            systemPrompt += ` You are performing a Comparative Analysis between Document A ("${docA}") and Document B ("${docB}"). Generate a detailed Markdown Comparison Table comparing both sources across Key Topics, Methodology, Differences, and Takeaways.`;

            const docsA = chatDocs.filter((d) => d.source === docA);
            const docsB = chatDocs.filter((d) => d.source === docB);

            const scoreAndSort = (docs) =>
                docs
                    .map((doc) => ({
                        ...doc,
                        score: cosineSimilarity(questionVector, doc.vector),
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 4);

            const topA = scoreAndSort(docsA);
            const topB = scoreAndSort(docsB);

            const contextA = topA.map((d) => `[Doc A: ${d.source}${d.page ? ` (p. ${d.page})` : ''}]: ${d.content}`).join('\n\n');
            const contextB = topB.map((d) => `[Doc B: ${d.source}${d.page ? ` (p. ${d.page})` : ''}]: ${d.content}`).join('\n\n');

            context = `=== DOCUMENT A ("${docA}") ===\n${contextA}\n\n=== DOCUMENT B ("${docB}") ===\n${contextB}`;

            citations = [...topA, ...topB].map((d) => ({
                source: d.source,
                page: d.page,
                excerpt: d.content.slice(0, 180) + '...',
            }));
        } else if (chatDocs.length > 0) {
            // STANDARD SINGLE-DOC / MULTI-DOC RAG PIPELINE
            const scoredDocs = chatDocs
                .map((doc) => ({
                    content: doc.content,
                    source: doc.source,
                    page: doc.page,
                    score: cosineSimilarity(questionVector, doc.vector),
                }))
                .sort((a, b) => b.score - a.score);

            const topDocs = scoredDocs.slice(0, 6);

            context = topDocs.map((doc) => doc.content).join('\n---\n');

            const rawCitations = topDocs.map((doc) => ({
                source: doc.source,
                page: doc.page,
                excerpt: doc.content.slice(0, 180) + '...',
            }));

            citations = rawCitations.sort((a, b) => {
                if (a.page && b.page) return a.page - b.page;
                return 0;
            });
        }

        const userContent = context ? `Context:\n${context}\n\nQuestion: ${question}` : question;

        const answerPromise = fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent },
                ],
                temperature: persona === 'coder' ? 0.1 : 0.3,
                max_tokens: 1500,
            }),
        });

        const followupsPromise = fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You generate short follow-up questions. Output ONLY a raw JSON array of 3 strings, e.g. ["Question 1?", "Question 2?", "Question 3?"]. Do not output extra text.',
                    },
                    { role: 'user', content: `User asked: "${question}". Give 3 relevant follow-up questions.` },
                ],
                temperature: 0.5,
                max_tokens: 200,
            }),
        });

        const [ansRes, folRes] = await Promise.all([answerPromise, followupsPromise]);
        const ansData = await ansRes.json();
        const folData = await folRes.json();

        if (!ansRes.ok) throw new Error(ansData?.error?.message || 'Failed to fetch answer from Groq');

        const answer = ansData.choices[0].message.content;

        let followups = [];
        try {
            const rawFol = folData?.choices?.[0]?.message?.content?.trim() || '';
            const jsonMatch = rawFol.match(/\[.*\]/s);
            if (jsonMatch) followups = JSON.parse(jsonMatch[0]);
        } catch (err) {
            followups = ['Can you explain this further?', 'What are some practical examples?', 'Can you summarize the main points?'];
        }

        // 3. STORE RESULT IN SEMANTIC CACHE
        if (!isComparisonMode) {
            semanticCache.push({
                questionVector,
                questionText: question,
                answer,
                followups,
                citations,
            });
            if (semanticCache.length > 100) semanticCache.shift();
        }

        res.json({ answer, followups, citations, cached: false });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
});

// CLEAR SESSION
app.post('/api/clear', (req, res) => {
    const { chatId } = req.body;
    const targetChatId = chatId ? String(chatId) : null;

    if (targetChatId) {
        delete vectorDocs[targetChatId];
        delete activeFiles[targetChatId];
    } else {
        vectorDocs = {};
        activeFiles = {};
    }
    res.json({ success: true, message: 'Vector store updated.' });
});

app.listen(PORT, () => console.log(`Fast Groq RAG Server running on http://localhost:${PORT}`));