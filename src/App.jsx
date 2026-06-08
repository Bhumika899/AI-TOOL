import { useState } from "react";
import "./App.css";
import { URL } from "./assets/constants";
import Answer from "./components/Answers";

function App() {

  const [question, setQuestion] = useState("");
  const [result, setResult] = useState([]);

  const askQuestion = async () => {

    try {

      const payload = {
        contents: [
          {
            parts: [
              {
                text: question,
              },
            ],
          },
        ],
      };

      let response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      response = await response.json();

      console.log(response);

      if (response.error) {
        setResult([response.error.message]);
        return;
      }

      const text =
        response.candidates[0].content.parts[0].text;

      const dataArray = text
        .split("*")
        .filter(item => item.trim() !== "");

      setResult(dataArray);

    } catch (error) {
      console.log(error);
      setResult(["Something went wrong"]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-5 h-screen">

        {/* Sidebar */}
        <div className="col-span-1 bg-zinc-800"></div>

        {/* Main Content */}
        <div className="col-span-4 p-10">

          <div className="container h-120">
            <div className="text-white whitespace-pre-wrap">

              <ul>
                {
                  result && result.map((item, index) => (
                    <li className="text-left p-10" key={index}>
                      <Answer ans={item} />
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>

          <div className="bg-zinc-800 w-1/2 text-white p-1 pr-5 h-16 m-auto rounded-4xl border border-zinc-700 flex items-center">

            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full h-full p-3 outline-none bg-transparent"
              placeholder="Ask me anything"
            />

            <button onClick={askQuestion}>
              Ask
            </button>

          </div>

        </div>
      </div>
    </>
  );
}

export default App;