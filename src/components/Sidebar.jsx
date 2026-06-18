function Sidebar({
    theme,
    setTheme,
    searchTerm,
    setSearchTerm,
    filteredHistory,
    openChat,
    deleteHistory,
    clearHistory,
    recentHistory,
}) {
    return (
        <div className={`col-span-1 p-4 overflow-y-auto ${theme === "dark"
            ? "bg-zinc-800"
            : "bg-white border-r"
            }`}>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Recent Chats
            </h2>
            <div className="mb-4">
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className={`w-full p-2 rounded border ${theme === "dark"
                            ? "bg-zinc-700 text-white border-zinc-600"
                            : "bg-white text-black border-gray-300"
                        }`}
                >
                    <option value="dark">🌙 Dark Mode</option>
                    <option value="light">☀️ Light Mode</option>
                </select>
            </div>

            <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-2 mb-4 rounded outline-none ${theme === "dark"
                    ? "bg-zinc-700 text-white"
                    : "bg-gray-100 text-black border"
                    }`}
            />

            {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between items-center p-2 mb-2 rounded hover:bg-zinc-700"
                    >
                        <span
                            onClick={() => openChat(item)}
                            className={`truncate flex-1 cursor-pointer ${theme === "dark"
                                ? "text-zinc-300"
                                : "text-black"
                                }`}
                        >
                            {item.question}
                        </span>

                        <button
                            onClick={() => deleteHistory(item.id)}
                            className="text-red-400 hover:text-red-600 ml-2"
                        >
                            ✕
                        </button>
                    </div>
                ))
            ) : (
                <p
                    className={`${theme === "dark"
                        ? "text-zinc-400"
                        : "text-gray-600"
                        }`}
                >
                    {searchTerm
                        ? "No matching chats found."
                        : "No chat history found."}
                </p>
            )}

            {recentHistory.length > 0 && (
                <button
                    onClick={clearHistory}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                    Clear History
                </button>
            )}
        </div>
    );
}

export default Sidebar;