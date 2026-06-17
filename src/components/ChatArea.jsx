import Answer from "./Answers";

function ChatArea({
    messages,
    loading,
    messagesEndRef,
}) {
    return (
        <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                    <h4 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Chatbot
                    </h4>

                    <p className="text-zinc-400 mt-4">
                        Ask anything and get instant answers
                    </p>
                </div>
            )}

            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`flex mb-4 ${msg.type === "question"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                >
                    <div
                        className={`max-w-[75%] px-5 py-3 rounded-2xl ${msg.type === "question"
                                ? "bg-blue-600 text-white"
                                : "bg-zinc-800 text-white"
                            }`}
                    >
                        {msg.type === "answer" ? (
                            <Answer ans={msg.text} />
                        ) : (
                            <p>{msg.text}</p>
                        )}
                    </div>
                </div>
            ))}

            {loading && (
                <div className="flex justify-start">
                    <div className="bg-zinc-800 px-5 py-4 rounded-2xl flex gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef}></div>
        </div>
    );
}

export default ChatArea;