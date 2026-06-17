function ChatInput({
    question,
    setQuestion,
    askQuestion,
    handleKeyDown,
    loading,
}) {
    return (
        <div className="p-6">
            <div className="bg-zinc-800 border border-zinc-700 rounded-3xl flex items-center px-4 py-2 w-3/4 mx-auto">
                <input
                    type="text"
                    value={question}
                    onChange={(e) =>
                        setQuestion(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent text-white outline-none p-3"
                />

                <button
                    onClick={askQuestion}
                    disabled={loading}
                    className="text-white px-4 py-2"
                >
                    {loading ? "..." : "Ask"}
                </button>
            </div>
        </div>
    );
}

export default ChatInput;