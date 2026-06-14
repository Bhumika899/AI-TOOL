import { useState, useEffect } from "react";
import "./App.css";
import { URL } from "./assets/constants";
import Answer from "./components/Answers";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    try {
      const history =
        JSON.parse(localStorage.getItem("history")) || [];

      setRecentHistory(history);
    } catch (error) {
      setRecentHistory([]);
    }
  }, []);

  // Delete a particular history item
  const deleteHistory = (indexToDelete) => {
    const updatedHistory = recentHistory.filter(
      (_, index) => index !== indexToDelete
    );

    setRecentHistory(updatedHistory);

    localStorage.setItem(
      "history",
      JSON.stringify(updatedHistory)
    );
  };

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question;

    // Get existing history
    let history = [];

    try {
      const storedHistory = localStorage.getItem("history");

      history = storedHistory
        ? JSON.parse(storedHistory)
        : [];

      if (!Array.isArray(history)) {
        history = [];
      }
    } catch {
      history = [];
    }

    // Add latest question to history
    const updatedHistory = [
      userQuestion,
      ...history,
    ].slice(0, 20);

    localStorage.setItem(
      "history",
      JSON.stringify(updatedHistory)
    );

    setRecentHistory(updatedHistory);

    // Show question in chat
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
              content:
                "Respond in Markdown using headings, bullet points and formatting.",
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

      if (!response.ok) {
        throw new Error(
          data?.error?.message || "Request failed"
        );
      }

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

  const clearHistory = () => {
    localStorage.removeItem("history");
    setRecentHistory([]);
  };

  return (
    <div className="grid grid-cols-5 h-screen bg-zinc-900">
      {/* Sidebar */}
      <div className="col-span-1 bg-zinc-800 p-4 overflow-y-auto">
        <h2 className="text-white text-xl font-bold mb-4">
          Recent Chats
        </h2>

        {recentHistory.length > 0 ? (
          recentHistory.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 mb-2 rounded hover:bg-zinc-700"
            >
              <span className="text-zinc-300 truncate flex-1">
                {item}
              </span>

              <button
                onClick={() => deleteHistory(index)}
                className="text-red-400 hover:text-red-600 ml-2"
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <p className="text-zinc-400">
            No chat history found.
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
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-white px-5 py-3 rounded-2xl">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
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
      </div>
    </div>
  );
}

export default App;