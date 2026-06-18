function ChatInput({
    question,
    theme,
    setQuestion,
    askQuestion,
    handleKeyDown,
    loading,
}) {
    return (
        <div className="p-6">
            <div className={`border rounded-3xl flex items-center px-4 py-2 w-3/4 mx-auto ${theme === "dark"
                ? "bg-zinc-800 border-zinc-700"
                : "bg-white border-gray-300 shadow-md"
                }`}>
                <input
                    type="text"
                    value={question}
                    onChange={(e) =>
                        setQuestion(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className={`flex-1 bg-transparent outline-none p-3 ${theme === "dark"
                        ? "text-white placeholder:text-zinc-400"
                        : "text-black placeholder:text-gray-500"
                        }`}
                />

                <button
                    onClick={askQuestion}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg ${theme === "dark"
                            ? "text-white hover:bg-zinc-700"
                            : "text-black hover:bg-gray-200"
                        }`}
                >
                    {loading ? "..." : "Ask"}
                </button>
            </div>
        </div>
    );
}

export default ChatInput;