import { useState } from "react";
import html2pdf from "html2pdf.js";
import {
    Plus,
    Search,
    Pin,
    Trash2,
    Edit2,
    Moon,
    Sun,
    Check,
    X,
    MessageSquare,
    LogIn,
    LogOut,
    FolderOpen,
    Download,
    FileCode,
    FileText,
    FileSpreadsheet,
} from "lucide-react";

function Sidebar({
    newChat,
    theme,
    setTheme,
    searchTerm,
    setSearchTerm,
    filteredHistory,
    openChat,
    deleteHistory,
    clearHistory,
    togglePin,
    renameChat,
    user,
    setShowAuthModal,
    handleLogout,
    sessionFiles = [],
    onDeleteSessionFile,
    activeChatMessages = [],
}) {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [showFilesDrawer, setShowFilesDrawer] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const isDark = theme === "dark";

    const handleStartRename = (e, item) => {
        e.stopPropagation();
        setEditingId(item.id || item.chatId);
        setEditTitle(item.title);
    };

    const handleSaveRename = (e, id) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            renameChat(id, editTitle.trim());
        }
        setEditingId(null);
    };

    // EXPORT HANDLERS
    const exportAsMarkdown = () => {
        if (activeChatMessages.length === 0) return alert("No messages to export!");
        let markdownContent = `# QueryBot Chat Export\n\n`;
        activeChatMessages.forEach((m) => {
            markdownContent += `### ${m.type === "question" ? "User" : "QueryBot"}\n${m.text}\n\n`;
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
        if (activeChatMessages.length === 0) return alert("No messages to export!");
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(activeChatMessages, null, 2));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `querybot-chat-${Date.now()}.json`;
        a.click();
        setShowExportMenu(false);
    };

    const exportAsPDF = () => {
        const element = document.getElementById("chat-export-container");
        if (!element || activeChatMessages.length === 0) return alert("No messages to export!");

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

    return (
        <div
            className={`w-80 h-full flex flex-col justify-between border-r transition-all shrink-0 relative ${isDark ? "bg-zinc-950 border-zinc-800/80 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                }`}
        >
            {/* Top Header & Search */}
            <div className="p-4 space-y-4">
                {/* New Chat Button */}
                <button
                    onClick={newChat}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-base font-medium cursor-pointer ${isDark
                        ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 shadow-sm"
                        : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-sm"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Plus size={20} />
                        <span className="font-semibold text-base">New Chat</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">⌘N</span>
                </button>

                {/* Session Documents & Export Dropdown Trigger */}
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowFilesDrawer(!showFilesDrawer)}
                        className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border text-sm font-medium cursor-pointer transition-colors ${showFilesDrawer
                            ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                            : isDark
                                ? "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white"
                                : "bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900"
                            }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <FolderOpen size={17} />
                            <span className="text-sm">Session Docs</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                            {sessionFiles.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className={`p-2.5 rounded-2xl border text-sm cursor-pointer transition-colors ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-700"
                            }`}
                        title="Export Chat History"
                    >
                        <Download size={18} />
                    </button>

                    {/* Export Dropdown Menu */}
                    {showExportMenu && (
                        <div
                            className={`absolute right-0 top-12 z-50 w-48 rounded-2xl border shadow-2xl p-1.5 space-y-1 ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
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

                {/* Session Files Drawer */}
                {showFilesDrawer && (
                    <div
                        className={`p-3.5 rounded-2xl border space-y-2 max-h-48 overflow-y-auto ${isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                            }`}
                    >
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Documents</p>
                        {sessionFiles.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No files in this chat.</p>
                        ) : (
                            sessionFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-800/40 text-sm">
                                    <span className="truncate text-zinc-200">{file.fileName}</span>
                                    <button
                                        onClick={() => onDeleteSessionFile && onDeleteSessionFile(file.fileName)}
                                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer shrink-0"
                                        title="Delete File"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Search Bar */}
                <div
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-base ${isDark ? "bg-zinc-900/80 border-zinc-800/80" : "bg-white border-zinc-200"
                        }`}
                >
                    <Search size={18} className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search chats..."
                        className="bg-transparent outline-none w-full placeholder-zinc-400 text-sm md:text-base"
                    />
                </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1.5">
                {filteredHistory.length === 0 ? (
                    <div className="text-center text-base text-zinc-500 py-10 font-normal">
                        No recent conversations
                    </div>
                ) : (
                    filteredHistory.map((item) => {
                        const id = item.id || item.chatId;
                        return (
                            <div
                                key={id}
                                onClick={() => openChat(item)}
                                className={`group flex items-center justify-between px-4 py-3 rounded-2xl text-sm md:text-base font-medium cursor-pointer transition-colors ${isDark ? "hover:bg-zinc-900 text-zinc-100" : "hover:bg-zinc-200/70 text-zinc-800"
                                    }`}
                            >
                                <div className="flex items-center gap-3 truncate pr-2">
                                    <MessageSquare size={18} className="text-zinc-400 shrink-0" />
                                    {editingId === id ? (
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="bg-transparent border-b border-blue-500 outline-none text-base w-full"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="truncate text-sm md:text-base">{item.title}</span>
                                    )}
                                </div>

                                {/* Action Icons */}
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingId === id ? (
                                        <>
                                            <button
                                                onClick={(e) => handleSaveRename(e, id)}
                                                className="text-emerald-500 hover:text-emerald-400 p-1"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(null);
                                                }}
                                                className="text-zinc-500 hover:text-zinc-400 p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePin(id);
                                                }}
                                                className={`p-1 ${item.pinned ? "text-amber-500" : "text-zinc-400 hover:text-zinc-200"}`}
                                            >
                                                <Pin size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleStartRename(e, item)}
                                                className="text-zinc-400 hover:text-zinc-200 p-1"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteHistory(id);
                                                }}
                                                className="text-zinc-400 hover:text-red-400 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Footer */}
            <div className={`p-4 border-t space-y-3 ${isDark ? "border-zinc-800/80" : "border-zinc-200"}`}>
                {user ? (
                    <div
                        className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                            }`}
                    >
                        <div className="flex items-center gap-3 truncate pr-1">
                            <div
                                className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 border border-amber-500/50 flex items-center justify-center text-base font-bold text-amber-100 shrink-0 shadow-sm"
                                title={`${user.name || "User"} (${user.email || ""})`}
                            >
                                {(user.name || user.email || "B").charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                                <p className="text-base font-semibold truncate leading-snug">{user.name || "User"}</p>
                                <p className="text-xs text-zinc-400 truncate leading-snug">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-zinc-400 hover:text-red-400 p-2 rounded-full transition-colors cursor-pointer shrink-0"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-base font-medium py-3 rounded-2xl transition-all shadow-md cursor-pointer"
                    >
                        <LogIn size={18} />
                        <span>Sign In</span>
                    </button>
                )}

                {/* Theme & Clear Actions */}
                <div className="flex items-center justify-between px-1 pt-1">
                    <button
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                        {isDark ? <Sun size={17} /> : <Moon size={17} />}
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>

                    {filteredHistory.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="text-sm font-medium text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;