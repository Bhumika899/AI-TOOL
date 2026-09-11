import { useState } from "react";

// import SpeechRecognition, {
//     useSpeechRecognition,
// } from "react-speech-recognition";
function ChatInput({
    question,
    mode,

    theme,
    setMode,
    setQuestion,
    askQuestion,
    handleKeyDown,
    loading,
    shareChat,
}) {
    const [listening, setListening] =
        useState(false);
    const startListening = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported");
            return;
        }

        const recognition =
            new SpeechRecognition();

        recognition.start();

        setListening(true);

        recognition.onresult = (event) => {
            setQuestion(
                event.results[0][0].transcript
            );
        };

        recognition.onend = () => {
            setListening(false);
        };
    };
    return (
        <div className="p-6">
            <div className={`border rounded-3xl flex items-center px-4 py-2 w-3/4 mx-auto ${theme === "dark"
                ? "bg-zinc-800 border-zinc-700"
                : "bg-white border-gray-300 shadow-md"
                }`}>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className={`flex-1 bg-transparent outline-none p-3 ${theme === "dark"
                        ? "text-white placeholder:text-zinc-400"
                        : "text-black placeholder:text-gray-500"
                        }`}
                />

                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className={`mx-2 p-2 rounded ${theme === "dark"
                        ? "bg-zinc-700 text-white"
                        : "bg-gray-200 text-black"
                        }`}
                >
                    <option value="chat">💬 Chat Mode</option>
                    <option value="image">🖼️ Image Generator</option>
                </select>
                <div className="flex gap-2">
                    <button
                        onClick={startListening}
                        className={`px-3 py-2 rounded ${theme === "dark"
                            ? "bg-zinc-700 text-white"
                            : "bg-gray-200 text-black"
                            }`}
                    >
                        {listening ? "🎙️" : "🎤"}
                    </button>


                    <button
                        onClick={askQuestion}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        {loading ? "..." : "Ask"}
                    </button>


                </div>
            </div>
        </div >
    );
}

export default ChatInput;