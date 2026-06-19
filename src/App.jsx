import Answer from "./components/Answers";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { URL } from "./assets/constants";

import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import ChatInput from "./components/ChatInput";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);
  const [selectedChatId, setSelectedChatId] =
    useState(null);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    try {
      const history =
        JSON.parse(localStorage.getItem("history")) || [];

      setRecentHistory(history);
    } catch (error) {
      setRecentHistory([]);
    }
  }, []);



  const clearHistory = () => {
    localStorage.removeItem("history");
    setRecentHistory([]);
    setMessages([]);
    setSelectedChatId(null);
  };

  const openChat = (chat) => {
    setSelectedChatId(chat.id);
    setMessages(chat.messages);
  };
  const deleteHistory = (id) => {
    const updatedHistory = recentHistory.filter(
      (chat) => chat.id !== id
    );

    setRecentHistory(updatedHistory);

    localStorage.setItem(
      "history",
      JSON.stringify(updatedHistory)
    );

    // If currently opened chat is deleted
    if (selectedChatId === id) {
      setMessages([]);
      setSelectedChatId(null);
    }
  };
  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question;

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
      const conversationHistory = messages.map(
        (msg) => ({
          role:
            msg.type === "question"
              ? "user"
              : "assistant",
          content: msg.text,
        })
      );
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY
            }`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content:
                "Respond in proper Markdown."
            },
            ...conversationHistory,
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

      const newChatItem = {
        id:
          selectedChatId || Date.now(),

        title:
          selectedChatId
            ? recentHistory.find(
              (c) =>
                c.id === selectedChatId
            )?.title
            : userQuestion,

        messages: [
          ...messages,
          {
            type: "question",
            text: userQuestion,
          },
          {
            type: "answer",
            text: answer,
          },
        ],
      };

      let updatedHistory;

      if (selectedChatId) {
        updatedHistory = recentHistory.map(
          (chat) =>
            chat.id === selectedChatId
              ? newChatItem
              : chat
        );
      } else {
        updatedHistory = [
          newChatItem,
          ...recentHistory,
        ];
      }

      localStorage.setItem(
        "history",
        JSON.stringify(updatedHistory)
      );

      setRecentHistory(updatedHistory);

      setSelectedChatId(
        newChatItem.id
      );


      // const uniqueHistory = [
      //   ...new Map(
      //     combined.map((item) => [
      //       item.question
      //         .trim()
      //         .replace(/\s+/g, " ")
      //         .toLowerCase(),
      //       item,
      //     ])
      //   ).values(),
      // ].slice(0, 20);

      // localStorage.setItem(
      //   "history",
      //   JSON.stringify(uniqueHistory)
      // );

      // setRecentHistory(uniqueHistory);
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

  const filteredHistory = recentHistory.filter(
    (item) =>
      (item.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
  const newChat = () => {
    setMessages([]);
    setSelectedChatId(null);
  };

  return (
    <div
      className={`grid grid-cols-5 h-screen ${theme === "dark"
        ? "bg-zinc-900 text-white"
        : "bg-gray-100 text-black"
        }`}
    >
      <Sidebar
        newChat={newChat}
        theme={theme}
        setTheme={setTheme}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredHistory={filteredHistory}
        openChat={openChat}
        deleteHistory={deleteHistory}
        clearHistory={clearHistory}
        recentHistory={recentHistory}
      />


      <div
        className={`col-span-4 flex flex-col ${theme === "dark"
          ? "bg-zinc-900"
          : "bg-gray-100"
          }`}
      >

        <ChatArea
          theme={theme}
          messages={messages}
          loading={loading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          theme={theme}
          question={question}
          setQuestion={setQuestion}
          askQuestion={askQuestion}
          handleKeyDown={handleKeyDown}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;