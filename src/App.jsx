import { useState } from "react";
import "./App.css";
import { URL } from "./assets/constants";
import Answer from "./components/Answers";

function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

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
                "Format responses using markdown headings, bullet points, and proper spacing.",
            },
            {
              role: "user",
              content: question,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();

      console.log(data);

      if (data.error) {
        setResult([data.error.message]);
        return;
      }

      const answer =
        data?.choices?.[0]?.message?.content ||
        "No response received.";

      // Store the complete markdown response
      setResult([answer]);

      setQuestion("");
    } catch (error) {
      console.error(error);
      setResult(["Something went wrong."]);
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
    <div className="grid grid-cols-5 h-screen">
      {/* Sidebar */}
      <div className="col-span-1 bg-zinc-800"></div>

      {/* Main Content */}
      <div className="col-span-4 p-10 flex flex-col">
        {/* Answers */}
        <div className="flex-1 overflow-y-auto text-zinc-300 px-4">
          <ul>
            {result.map((item, index) => (
              <li key={index + Math.random()} className="mb-4">
                <Answer ans={item.text} />
              </li>
            ))}
          </ul>
        </div>

        {/* Input Area */}
        <div className="bg-zinc-800 w-1/2 text-white p-1 pr-5 h-16 m-auto rounded-4xl border border-zinc-700 flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-3 outline-none bg-transparent"
            placeholder="Ask me anything"
          />

          <button
            onClick={askQuestion}
            disabled={loading}
            className="px-4 py-2"
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;