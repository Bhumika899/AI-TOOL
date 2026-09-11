import { useState } from "react";
import html2pdf from "html2pdf.js";
import Answer from "./Answers";
import ChatInput from "./ChatInput";
import {
    FileText,
    Lightbulb,
    BookOpen,
    Code,
    ArrowUpRight,
    Compass,
    Share2,
    FileCheck,
    X,
    Volume2,
    VolumeX,
    Bookmark,
    Download,
    FileCode,
    FileSpreadsheet,
} from "lucide-react";

function ChatArea({
    theme,
    messages,
    loading,
    messagesEndRef,
    shareChat,
    askQuestion,
    userName = "User",
    user,
    setShowAuthModal,
    mode,
    setMode,
    question,
    setQuestion,
    handleKeyDown,
    onFileUpload,
    onRemoveFile,
    isIngesting,
    activeFileName,
    onScrapeUrl,
    persona,
    setPersona,
    toggleBookmarkMessage,
    sessionFiles = [], // <--- DESTRUCTURED HERE
}) {
    const isDark = theme === "dark";
    const [selectedCitation, setSelectedCitation] = useState(null);
    const [speakingIdx, setSpeakingIdx] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const rawString = user?.name || userName || "User";
    const nameBeforeDomain = rawString.split("@")[0];
    const cleanedAlphaOnly = nameBeforeDomain.replace(/[0-9_.]/g, " ");
    const spacedCamelCase = cleanedAlphaOnly.replace(/([a-z])([A-Z])/g, "$1 $2");
    const words = spacedCamelCase.trim().split(/\s+/);

    const rawFirstName = words[0] || "User";
    const cleanFirstName =
        rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

    // EXPORT HANDLERS
    const exportAsMarkdown = () => {
        if (!messages || messages.length === 0)
            return alert("No messages in current chat to export!");
        let markdownContent = `# QueryBot Chat Export\n\n`;
        messages.forEach((m) => {
            markdownContent += `### ${m.type === "question" ? "User" : "QueryBot"
                }\n${m.text}\n\n`;
        });

        const blob = new Blob([markdownContent], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `querybot-chat-${Date.now()}.md`;
        a.click();
        setShowExportMenu(false);
    };

    const exportAsJSON = () => {
        if (!messages || messages.length === 0)
            return alert("No messages in current chat to export!");
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(messages, null, 2));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `querybot-chat-${Date.now()}.json`;
        a.click();
        setShowExportMenu(false);
    };

    const exportAsPDF = () => {
        const element = document.getElementById("chat-export-container");
        if (!element || !messages || messages.length === 0)
            return alert("No messages in current chat to export!");

        const opt = {
            margin: 0.5,
            filename: `querybot-chat-${Date.now()}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        };

        html2pdf().set(opt).from(element).save();
        setShowExportMenu(false);
    };

    // Text-to-Speech Handler
    const handleSpeak = (text, index) => {
        if ("speechSynthesis" in window) {
            if (speakingIdx === index) {
                window.speechSynthesis.cancel();
                setSpeakingIdx(null);
            } else {
                window.speechSynthesis.cancel();
                const cleanText = text.replace(/[*#`_]/g, "");
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.onend = () => setSpeakingIdx(null);
                window.speechSynthesis.speak(utterance);
                setSpeakingIdx(index);
            }
        } else {
            alert("Text-to-speech is not supported in this browser.");
        }
    };

    const suggestions = [
        {
            icon: <FileText className={isDark ? "text-blue-400" : "text-blue-600"} size={18} />,
            title: "Summarize Document",
            desc: "Extract key takeaways, executive summaries, and core concepts from your documents",
            prompt: "Can you summarize the uploaded document for me?",
            badgeBg: isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100",
            cardBg: isDark
                ? "bg-zinc-900/80 border-zinc-800/80 hover:border-blue-500/40 hover:bg-zinc-900"
                : "bg-white border-zinc-200/80 hover:border-blue-300 hover:shadow-md",
        },
        {
            icon: <Lightbulb className={isDark ? "text-amber-400" : "text-amber-600"} size={18} />,
            title: "Explain Concepts",
            desc: "Simplify difficult terms, equations, and protocols into plain language",
            prompt: "Explain the main concept in simple terms.",
            badgeBg: isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100",
            cardBg: isDark
                ? "bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-900"
                : "bg-white border-zinc-200/80 hover:border-amber-300 hover:shadow-md",
        },
        {
            icon: <BookOpen className={isDark ? "text-emerald-400" : "text-emerald-600"} size={18} />,
            title: "Create Study Notes",
            desc: "Generate clean revision notes and bulleted lists for exam prep",
            prompt: "Create quick revision notes based on the document.",
            badgeBg: isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100",
            cardBg: isDark
                ? "bg-zinc-900/80 border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900"
                : "bg-white border-zinc-200/80 hover:border-emerald-300 hover:shadow-md",
        },
        {
            icon: <Code className={isDark ? "text-purple-400" : "text-purple-600"} size={18} />,
            title: "Practice Questions",
            desc: "Test your understanding with practice problems and sample questions",
            prompt: "Generate 5 practice questions based on this topic.",
            badgeBg: isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-100",
            cardBg: isDark
                ? "bg-zinc-900/80 border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900"
                : "bg-white border-zinc-200/80 hover:border-purple-300 hover:shadow-md",
        },
    ];

    return (
        <div className="flex-1 flex flex-col justify-between h-full overflow-hidden relative">
            {/* Top Header Controls for Exporting */}
            {messages.length > 0 && (
                <div className="px-6 py-2.5 flex justify-end items-center border-b border-zinc-800/40 relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${isDark
                            ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                            : "bg-white border-zinc-200 text-zinc-700"
                            }`}
                    >
                        <Download size={14} />
                        <span>Export Chat</span>
                    </button>

                    {showExportMenu && (
                        <div
                            className={`absolute right-6 top-12 z-50 w-48 rounded-2xl border shadow-2xl p-2 space-y-1 ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                                }`}
                        >
                            <button
                                onClick={exportAsMarkdown}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                            >
                                <FileCode size={14} /> Export Markdown (.md)
                            </button>
                            <button
                                onClick={exportAsPDF}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                            >
                                <FileText size={14} /> Export PDF (.pdf)
                            </button>
                            <button
                                onClick={exportAsJSON}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                            >
                                <FileSpreadsheet size={14} /> Export JSON (.json)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Main Chat Scroll Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" id="chat-export-container">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[68vh] max-w-5xl mx-auto px-4">
                        <div className="space-y-3 mb-12 text-center">
                            <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
                                <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                                    Hi, {cleanFirstName}
                                </span>
                            </h1>
                            <h2 className={`text-2xl md:text-3xl font-normal ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                Where would you like to start?
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            {suggestions.map((card, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => askQuestion && askQuestion(card.prompt)}
                                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between h-48 group relative overflow-hidden shadow-sm ${card.cardBg}`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <h3 className={`text-sm font-semibold truncate ${isDark ? "text-zinc-100 group-hover:text-blue-400" : "text-zinc-900 group-hover:text-blue-600"}`}>
                                            {card.title}
                                        </h3>
                                        <ArrowUpRight
                                            size={16}
                                            className={`transition-all shrink-0 ${isDark ? "text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : "text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`}
                                        />
                                    </div>

                                    <div className="h-12 flex items-center">
                                        <p className={`text-xs leading-relaxed font-normal line-clamp-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                            {card.desc}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-start pt-1">
                                        <div className={`p-2.5 rounded-2xl border transition-transform group-hover:scale-105 ${card.badgeBg}`}>
                                            {card.icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.type === "question" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed transition-all ${msg.type === "question"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : isDark
                                        ? "bg-zinc-900 border border-zinc-800/80 text-zinc-200"
                                        : "bg-white border border-zinc-200 text-zinc-800 shadow-sm"
                                    }`}
                            >
                                {msg.type === "answer" ? (
                                    <div className="space-y-3">
                                        <Answer ans={msg.text} theme={theme} />

                                        {/* SOURCE CITATIONS */}
                                        {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                                            <div className="pt-3 border-t border-zinc-800/60 mt-3">
                                                <p className="text-[11px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                                                    <FileCheck size={13} className="text-emerald-400" />
                                                    Source Citations
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.citations.map((cite, citeIdx) => (
                                                        <button
                                                            key={citeIdx}
                                                            onClick={() => setSelectedCitation(cite)}
                                                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${isDark
                                                                ? "bg-zinc-950 border-zinc-800 text-emerald-400 hover:bg-zinc-800/80"
                                                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                                                }`}
                                                        >
                                                            <span>📄 {cite.source}</span>
                                                            {cite.page && <span className="text-[10px] opacity-75">(Page {cite.page})</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SUGGESTED FOLLOWUPS */}
                                        {Array.isArray(msg.followups) && msg.followups.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-[11px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                                                    <Compass size={12} className="text-blue-400" />
                                                    Suggested follow-ups
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.followups.map((chip, chipIdx) => (
                                                        <button
                                                            key={chipIdx}
                                                            onClick={() => askQuestion && askQuestion(chip)}
                                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all text-left cursor-pointer ${isDark
                                                                ? "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60"
                                                                : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200"
                                                                }`}
                                                        >
                                                            {chip}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ANSWER TOOLBAR */}
                                        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/40 mt-3">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleSpeak(msg.text, index)}
                                                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                                    title="Read Aloud"
                                                >
                                                    {speakingIdx === index ? (
                                                        <VolumeX size={15} className="text-red-400" />
                                                    ) : (
                                                        <Volume2 size={15} />
                                                    )}
                                                    <span>{speakingIdx === index ? "Stop" : "Audio"}</span>
                                                </button>

                                                <button
                                                    onClick={() => toggleBookmarkMessage && toggleBookmarkMessage(index)}
                                                    className={`text-xs flex items-center gap-1 cursor-pointer transition-colors ${msg.bookmarked ? "text-amber-400 font-medium" : "text-zinc-400 hover:text-white"
                                                        }`}
                                                    title="Bookmark Response"
                                                >
                                                    <Bookmark size={15} className={msg.bookmarked ? "fill-amber-400 text-amber-400" : ""} />
                                                    <span>{msg.bookmarked ? "Pinned" : "Pin"}</span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={shareChat}
                                                className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <Share2 size={12} />
                                                <span>Share</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : msg.type === "image" ? (
                                    <div className="space-y-2">
                                        <img
                                            src={msg.text}
                                            alt="Generated AI"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/800x600?text=Image+Generation+Failed";
                                            }}
                                            className="rounded-2xl max-w-full h-auto object-cover border border-zinc-800 shadow-md min-h-[250px] bg-zinc-900"
                                        />
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div
                            className={`p-4 rounded-2xl flex items-center gap-1.5 ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Citation Excerpt Modal */}
            {selectedCitation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl relative transition-all ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                            }`}
                    >
                        <button
                            onClick={() => setSelectedCitation(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <FileCheck size={18} />
                            <h3 className="text-base font-semibold">Source Excerpt Preview</h3>
                        </div>

                        <p className="text-xs text-zinc-400 mb-4">
                            <strong>Source:</strong> {selectedCitation.source}{" "}
                            {selectedCitation.page ? `| Page ${selectedCitation.page}` : ""}
                        </p>

                        <div
                            className={`p-4 rounded-2xl border text-xs leading-relaxed max-h-60 overflow-y-auto ${isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                                }`}
                        >
                            "{selectedCitation.excerpt}"
                        </div>
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <ChatInput
                mode={mode}
                setMode={setMode}
                theme={theme}
                question={question}
                setQuestion={setQuestion}
                askQuestion={askQuestion}
                handleKeyDown={handleKeyDown}
                loading={loading}
                onFileUpload={onFileUpload}
                onRemoveFile={onRemoveFile}
                isIngesting={isIngesting}
                activeFileName={activeFileName}
                onScrapeUrl={onScrapeUrl}
                persona={persona}
                setPersona={setPersona}
                sessionFiles={sessionFiles} // <--- PASSED TO CHATINPUT
            />
        </div>
    );
}

export default ChatArea;