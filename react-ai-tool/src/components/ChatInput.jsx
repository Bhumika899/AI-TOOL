import { useState, useEffect, useRef } from "react";
import {
    Send,
    Paperclip,
    Globe,
    Sparkles,
    X,
    Mic,
    MicOff,
    ChevronDown,
    Bot,
    GraduationCap,
    Code2,
    FileText,
    Columns,
} from "lucide-react";

function ChatInput({
    mode,
    setMode,
    theme,
    question,
    setQuestion,
    askQuestion,
    handleKeyDown,
    loading,
    onFileUpload,
    onRemoveFile,
    isIngesting,
    activeFileName,
    onScrapeUrl,
    persona = "default",
    setPersona,
    sessionFiles = [],
}) {
    const isDark = theme === "dark";
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlToScrape, setUrlToScrape] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [showPersonaMenu, setShowPersonaMenu] = useState(false);

    // Comparison Modal State
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [docA, setDocA] = useState("");
    const [docB, setDocB] = useState("");

    const dropdownRef = useRef(null);

    // Close custom dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowPersonaMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initialize Web Speech API Recognition
    useEffect(() => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            const speechObj = new SpeechRecognition();
            speechObj.continuous = false;
            speechObj.interimResults = true;
            speechObj.lang = "en-US";

            speechObj.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0].transcript)
                    .join("");
                setQuestion(transcript);
            };

            speechObj.onerror = () => setIsListening(false);
            speechObj.onend = () => setIsListening(false);

            setRecognition(speechObj);
        }
    }, [setQuestion]);

    const toggleListening = () => {
        if (!recognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onFileUpload) {
            onFileUpload(file);
        }
    };

    const handleScrapeSubmit = (e) => {
        e.preventDefault();
        if (urlToScrape.trim() && onScrapeUrl) {
            onScrapeUrl(urlToScrape.trim());
            setUrlToScrape("");
            setShowUrlInput(false);
        }
    };

    const triggerComparison = () => {
        if (!docA || !docB) return alert("Please select two documents to compare!");
        if (docA === docB) return alert("Please select two different documents!");

        const comparisonPrompt = `Generate a detailed side-by-side comparative analysis table comparing "${docA}" and "${docB}".`;
        askQuestion &&
            askQuestion(comparisonPrompt, {
                isComparisonMode: true,
                docA,
                docB,
            });
        setShowCompareModal(false);
    };

    const personas = [
        { id: "default", label: "General Assistant", icon: <Bot size={15} /> },
        { id: "tutor", label: "Academic Tutor", icon: <GraduationCap size={15} /> },
        { id: "coder", label: "Code Reviewer", icon: <Code2 size={15} /> },
        { id: "summarizer", label: "Executive Summary", icon: <FileText size={15} /> },
    ];

    const currentPersona = personas.find((p) => p.id === persona) || personas[0];

    return (
        <div className="p-4 md:px-10 max-w-4xl mx-auto w-full relative">
            {/* SIDE-BY-SIDE COMPARISON MODAL */}
            {showCompareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                            }`}
                    >
                        <button
                            onClick={() => setShowCompareModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Columns size={20} />
                            <h3 className="text-lg font-semibold">Side-by-Side Comparison</h3>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4">
                            Select two uploaded documents to generate a comparative analysis table.
                        </p>

                        {sessionFiles.length < 2 ? (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center mb-4">
                                You need at least 2 uploaded documents in this session to perform a comparison.
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Document A</label>
                                    <select
                                        value={docA}
                                        onChange={(e) => setDocA(e.target.value)}
                                        className={`w-full p-2.5 rounded-xl text-xs border outline-none ${isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-100 border-zinc-200"
                                            }`}
                                    >
                                        <option value="">-- Select First Document --</option>
                                        {sessionFiles.map((f, i) => (
                                            <option key={i} value={f.fileName}>
                                                {f.fileName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Document B</label>
                                    <select
                                        value={docB}
                                        onChange={(e) => setDocB(e.target.value)}
                                        className={`w-full p-2.5 rounded-xl text-xs border outline-none ${isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-100 border-zinc-200"
                                            }`}
                                    >
                                        <option value="">-- Select Second Document --</option>
                                        {sessionFiles.map((f, i) => (
                                            <option key={i} value={f.fileName}>
                                                {f.fileName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={triggerComparison}
                            disabled={sessionFiles.length < 2 || !docA || !docB}
                            className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${docA && docB && docA !== docB
                                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                }`}
                        >
                            Generate Comparison Table 📊
                        </button>
                    </div>
                </div>
            )}

            {/* Floating URL Scraper Box */}
            {showUrlInput && (
                <form
                    onSubmit={handleScrapeSubmit}
                    className={`mb-3 p-3 rounded-2xl border flex items-center gap-2 shadow-xl ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        }`}
                >
                    <Globe size={18} className="text-blue-400 shrink-0 ml-2" />
                    <input
                        type="url"
                        value={urlToScrape}
                        onChange={(e) => setUrlToScrape(e.target.value)}
                        placeholder="Paste URL (e.g., https://docs.react.dev)..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder-zinc-400"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                    >
                        Fetch
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </form>
            )}

            {/* Floating File Attachment Badge */}
            {(activeFileName || isIngesting) && (
                <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl bg-blue-500/10 border border-blue-500/20 w-fit text-xs text-blue-400 font-medium">
                    <span>{isIngesting ? "Parsing document..." : `📄 ${activeFileName}`}</span>
                    {!isIngesting && (
                        <button
                            onClick={onRemoveFile}
                            className="hover:text-red-400 transition-colors cursor-pointer ml-1"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* TALL & BROAD SINGLE-LINE BAR */}
            <div
                className={`rounded-3xl border px-4 py-3 flex items-center gap-3 shadow-2xl transition-all relative ${isListening
                        ? "ring-2 ring-red-500/50 border-red-500/40"
                        : isDark
                            ? "bg-zinc-900/90 border-zinc-800/90 focus-within:border-zinc-700"
                            : "bg-white border-zinc-200 focus-within:border-zinc-300"
                    }`}
            >
                {/* CUSTOM PERSONA DROPDOWN MENU */}
                <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${isDark
                                ? "bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
                                : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
                            }`}
                    >
                        <span className="text-blue-400">{currentPersona.icon}</span>
                        <span className="hidden sm:inline">{currentPersona.label}</span>
                        <ChevronDown size={14} className="text-zinc-500" />
                    </button>

                    {/* Floating Dark Glass Menu */}
                    {showPersonaMenu && (
                        <div
                            className={`absolute left-0 bottom-12 z-50 w-52 rounded-2xl border shadow-2xl p-1.5 space-y-1 backdrop-blur-md ${isDark
                                    ? "bg-zinc-900/95 border-zinc-800 text-zinc-200"
                                    : "bg-white/95 border-zinc-200 text-zinc-800"
                                }`}
                        >
                            {personas.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        setPersona && setPersona(p.id);
                                        setShowPersonaMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${persona === p.id
                                            ? "bg-blue-600 text-white"
                                            : isDark
                                                ? "hover:bg-zinc-800/80 text-zinc-300"
                                                : "hover:bg-zinc-100 text-zinc-700"
                                        }`}
                                >
                                    <span>{p.icon}</span>
                                    <span>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Text Prompt Input */}
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isListening
                            ? "Listening... Speak now..."
                            : mode === "image"
                                ? "Describe an image to generate..."
                                : "Ask QueryBot anything..."
                    }
                    className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder-zinc-500 px-1 font-normal"
                />

                {/* Action Tools & Send Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Document Comparison Button */}
                    <button
                        type="button"
                        onClick={() => setShowCompareModal(true)}
                        className={`p-2 rounded-2xl cursor-pointer transition-colors ${isDark
                                ? "text-zinc-400 hover:text-blue-400 hover:bg-zinc-800"
                                : "text-zinc-600 hover:text-blue-600 hover:bg-zinc-100"
                            }`}
                        title="Side-by-Side Document Comparison"
                    >
                        <Columns size={18} />
                    </button>

                    {/* File Upload Button */}
                    <label
                        className={`p-2 rounded-2xl cursor-pointer transition-colors ${isDark
                                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                            }`}
                        title="Upload Document"
                    >
                        <Paperclip size={18} />
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.docx,.pptx,.csv,.xlsx,.txt"
                        />
                    </label>

                    {/* Web Reader Button */}
                    <button
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className={`p-2 rounded-2xl cursor-pointer transition-colors ${showUrlInput
                                ? "text-blue-400 bg-blue-500/10"
                                : isDark
                                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                            }`}
                        title="Scrape Web Page"
                    >
                        <Globe size={18} />
                    </button>

                    {/* Voice Input Mic */}
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2 rounded-2xl cursor-pointer transition-all ${isListening
                                ? "text-red-400 bg-red-500/20 animate-pulse"
                                : isDark
                                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                            }`}
                        title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    {/* Image Mode Button */}
                    <button
                        onClick={() => setMode(mode === "image" ? "chat" : "image")}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${mode === "image"
                                ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
                                : isDark
                                    ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                                    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"
                            }`}
                    >
                        <Sparkles size={14} />
                        <span className="hidden sm:inline">Image</span>
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={() => askQuestion && askQuestion()}
                        disabled={loading || !question.trim()}
                        className={`p-2.5 rounded-2xl transition-all cursor-pointer ml-1 ${question.trim() && !loading
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            }`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatInput;