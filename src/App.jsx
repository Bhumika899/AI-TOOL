import { useState } from "react";
import "./App.css";
import { URL } from "./assets/constants";
import Answer from "./components/Answers";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question;

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      {
        type: "question",
        text: userQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `
Return responses in Markdown format.

Use:
# Main Heading
## Sub Heading
- Bullet points

Make answers clean and well formatted.
              `,
            },
            {
              role: "user",
              content: userQuestion,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();

      console.log(data);

      const answer =
        data?.choices?.[0]?.message?.content ||
        "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          type: "answer",
          text: answer,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          type: "answer",
          text: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      askQuestion();
    }
  };

  return (
    <div className="grid grid-cols-5 h-screen bg-zinc-900">
      {/* Sidebar */}
      <div className="col-span-1 bg-zinc-800"></div>

      {/* Main Content */}
      <div className="col-span-4 flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6">
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
            <div className="flex justify-start mb-4">
              <div className="bg-zinc-800 text-white px-5 py-3 rounded-2xl">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="p-6">
          <div className="bg-zinc-800 border border-zinc-700 rounded-3xl flex items-center px-4 py-2 w-3/4 mx-auto">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
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
      </div>
    </div>
  );
}

export default App;