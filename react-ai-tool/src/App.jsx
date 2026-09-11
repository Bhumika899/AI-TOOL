import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import { User, Mail, Lock, X } from "lucide-react";

function App() {
  const [theme, setTheme] = useState("dark");
  const [mode, setMode] = useState("chat");
  const [persona, setPersona] = useState("default");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentChatId, setCurrentChatId] = useState(Date.now().toString());

  const [recentHistory, setRecentHistory] = useState(() => {
    const savedHistory = localStorage.getItem("querybot_history");
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse saved chat history:", e);
      }
    }
    return [];
  });

  const [isIngesting, setIsIngesting] = useState(false);
  const [activeFileName, setActiveFileName] = useState("");
  const [sessionFiles, setSessionFiles] = useState([]);

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const messagesEndRef = useRef(null);

  // Restore user session
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.id) fetchUserChats(parsed.id);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("querybot_history", JSON.stringify(recentHistory));
  }, [recentHistory]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch session files when chat changes
  useEffect(() => {
    fetch(`http://localhost:5000/api/files/${currentChatId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.files) setSessionFiles(data.files);
      })
      .catch((err) => console.error("Error fetching session files:", err));
  }, [currentChatId]);

  // MongoDB Chat Fetching & Syncing
  const fetchUserChats = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chats/${userId}`);
      const data = await res.json();
      if (res.ok && data.chats) setRecentHistory(data.chats);
    } catch (e) {
      console.error("Failed to fetch MongoDB chats:", e);
    }
  };

  const syncChatToMongo = async (chatId, title, msgs) => {
    if (!user?.id) return;
    try {
      await fetch("http://localhost:5000/api/chats/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, chatId, title, messages: msgs }),
      });
    } catch (e) {
      console.error("Failed to sync chat to MongoDB:", e);
    }
  };

  // Toggle Message Bookmark (Pinning individual responses within a chat thread)
  const toggleBookmarkMessage = (index) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          bookmarked: !updated[index].bookmarked,
        };
      }
      updateChatHistory(updated);
      return updated;
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    const endpoint = isSignUp
      ? "http://localhost:5000/api/signup"
      : "http://localhost:5000/api/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        setShowAuthModal(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
        if (data.user.id) fetchUserChats(data.user.id);
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server on http://localhost:5000");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Helper to maintain and sync history with custom titles
  const updateChatHistory = (updatedMessages, customTitle = null) => {
    if (updatedMessages.length === 0) return;

    const userQuestion = updatedMessages.find((m) => m.type === "question")?.text;

    let title = customTitle;
    if (!title) {
      if (userQuestion) {
        title = userQuestion.slice(0, 30) + (userQuestion.length > 30 ? "..." : "");
      } else if (activeFileName) {
        title = `📄 ${activeFileName.slice(0, 25)}`;
      } else {
        title = "New Conversation";
      }
    }

    setRecentHistory((prev) => {
      const idx = prev.findIndex(
        (item) => item.chatId === currentChatId || item.id === currentChatId || item._id === currentChatId
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], title, messages: updatedMessages };
        return updated;
      }
      return [
        {
          id: currentChatId,
          chatId: currentChatId,
          title,
          messages: updatedMessages,
          pinned: false,
        },
        ...prev,
      ];
    });

    syncChatToMongo(currentChatId, title, updatedMessages);
  };

  const handleFileUpload = async (file) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsIngesting(true);
    setActiveFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", currentChatId);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        if (data.activeFiles) setSessionFiles(data.activeFiles);
        if (data.sampleText) {
          const sumRes = await fetch("http://localhost:5000/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sampleText: data.sampleText }),
          });
          const sumData = await sumRes.json();
          if (sumData.summary) {
            const updatedWithSummary = [
              ...messages,
              {
                type: "answer",
                text: `📄 **Document Uploaded:** ${file.name}\n\n**Summary:**\n${sumData.summary}`,
              },
            ];
            setMessages(updatedWithSummary);
            updateChatHistory(updatedWithSummary, `📄 ${file.name.slice(0, 25)}`);
          }
        }
      } else {
        alert(data.error || "Failed to process document.");
        setActiveFileName("");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload document to server.");
      setActiveFileName("");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleScrapeUrl = async (url) => {
    try {
      const res = await fetch("http://localhost:5000/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, chatId: currentChatId }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.activeFiles) setSessionFiles(data.activeFiles);
        setActiveFileName(data.sourceName);

        if (data.sampleText) {
          const sumRes = await fetch("http://localhost:5000/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sampleText: data.sampleText }),
          });
          const sumData = await sumRes.json();
          if (sumData.summary) {
            const updatedWithSummary = [
              ...messages,
              {
                type: "answer",
                text: `🌐 **Web Page Imported:** ${url}\n\n**Summary:**\n${sumData.summary}`,
              },
            ];
            setMessages(updatedWithSummary);
            updateChatHistory(updatedWithSummary, data.sourceName);
          }
        }
      } else {
        alert(data.error || "Failed to scrape web page.");
      }
    } catch (err) {
      console.error("Scrape Error:", err);
      alert("Could not connect to backend server.");
    }
  };

  const handleDeleteSessionFile = async (fileName) => {
    try {
      const encoded = encodeURIComponent(fileName);
      const res = await fetch(
        `http://localhost:5000/api/files/${currentChatId}/${encoded}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.activeFiles) {
        setSessionFiles(data.activeFiles);
        if (activeFileName === fileName) setActiveFileName("");
      }
    } catch (err) {
      console.error("Delete Session File Error:", err);
    }
  };

  const handleRemoveFile = async () => {
    setActiveFileName("");
    try {
      await fetch("http://localhost:5000/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId }),
      });
      setSessionFiles([]);
    } catch (err) {
      console.error("Error clearing document vector store:", err);
    }
  };

  // ACCEPT EXTRA PARAMS (isComparisonMode, docA, docB)
  const askQuestion = async (customPrompt, extraParams = {}) => {
    const query = customPrompt || question;
    if (!query.trim() || loading) return;

    const newQuestionMsg = { type: "question", text: query };
    const updatedWithQuestion = [...messages, newQuestionMsg];

    setMessages(updatedWithQuestion);
    updateChatHistory(updatedWithQuestion);
    setQuestion("");
    setLoading(true);

    try {
      if (mode === "image") {
        const cleanPrompt = query.trim().toLowerCase();
        const encoded = encodeURIComponent(cleanPrompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&seed=${Math.floor(
          Math.random() * 100000
        )}&nologo=true`;

        const updatedWithImage = [...updatedWithQuestion, { type: "image", text: imageUrl }];
        setMessages(updatedWithImage);
        updateChatHistory(updatedWithImage);
      } else {
        const res = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: query,
            chatId: currentChatId,
            persona,
            ...extraParams, // FORWARD COMPARISON PAYLOAD
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const updatedWithAnswer = [
            ...updatedWithQuestion,
            {
              type: "answer",
              text: data.answer,
              followups: data.followups || [],
              citations: data.citations || [],
              cached: data.cached || false,
            },
          ];
          setMessages(updatedWithAnswer);
          updateChatHistory(updatedWithAnswer);
        } else {
          const updatedWithError = [
            ...updatedWithQuestion,
            {
              type: "answer",
              text: data.error || "Something went wrong fetching the answer.",
            },
          ];
          setMessages(updatedWithError);
          updateChatHistory(updatedWithError);
        }
      }
    } catch (error) {
      const updatedWithError = [
        ...updatedWithQuestion,
        {
          type: "answer",
          text: "Error connecting to backend server. Please make sure server is running on port 5000.",
        },
      ];
      setMessages(updatedWithError);
      updateChatHistory(updatedWithError);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const newChat = () => {
    setMessages([]);
    setActiveFileName("");
    setSessionFiles([]);
    setCurrentChatId(Date.now().toString());
  };

  const openChat = (item) => {
    setMessages(item.messages || []);
    setCurrentChatId(item.chatId || item.id || item._id);
  };

  // Toggle Pin for entire conversation thread
  const togglePin = (id) => {
    setRecentHistory((prev) =>
      prev.map((item) => {
        const itemId = item.id || item.chatId || item._id;
        return itemId === id ? { ...item, pinned: !item.pinned } : item;
      })
    );
  };

  const renameChat = (id, newTitle) => {
    setRecentHistory((prev) =>
      prev.map((item) => {
        const itemId = item.id || item.chatId || item._id;
        return itemId === id ? { ...item, title: newTitle } : item;
      })
    );
  };

  const deleteHistory = async (id) => {
    setRecentHistory((prev) => {
      const updatedHistory = prev.filter(
        (item) => item.id !== id && item.chatId !== id && item._id !== id
      );

      if (id === currentChatId) {
        setMessages([]);
        setActiveFileName("");
        setSessionFiles([]);
        setCurrentChatId(Date.now().toString());
      }

      return updatedHistory;
    });

    if (user?.id) {
      try {
        await fetch(`http://localhost:5000/api/chats/${user.id}/${id}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error("Failed to delete chat from server:", e);
      }
    }
  };

  const clearHistory = () => {
    setRecentHistory([]);
    setMessages([]);
    setActiveFileName("");
    setSessionFiles([]);
    setCurrentChatId(Date.now().toString());
    localStorage.removeItem("querybot_history");
  };

  const shareChat = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Chat link copied to clipboard!");
  };

  // Sort: Pinned chats go FIRST, then preserve order
  const sortedHistory = [...recentHistory].sort((a, b) => {
    if (!!a.pinned === !!b.pinned) return 0;
    return a.pinned ? -1 : 1;
  });

  const filteredHistory = sortedHistory.filter((item) =>
    item.title ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) : false
  );

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${theme === "dark" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-black"
        }`}
    >
      <Sidebar
        togglePin={togglePin}
        renameChat={renameChat}
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
        user={user}
        setShowAuthModal={setShowAuthModal}
        handleLogout={handleLogout}
        sessionFiles={sessionFiles}
        onDeleteSessionFile={handleDeleteSessionFile}
        activeChatMessages={messages}
      />

      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <ChatArea
          shareChat={shareChat}
          theme={theme}
          messages={messages}
          loading={loading}
          messagesEndRef={messagesEndRef}
          askQuestion={askQuestion}
          userName={user?.name ? user.name : "User"}
          user={user}
          setShowAuthModal={setShowAuthModal}
          mode={mode}
          setMode={setMode}
          question={question}
          setQuestion={setQuestion}
          handleKeyDown={handleKeyDown}
          onFileUpload={handleFileUpload}
          onRemoveFile={handleRemoveFile}
          isIngesting={isIngesting}
          activeFileName={activeFileName}
          onScrapeUrl={handleScrapeUrl}
          persona={persona}
          setPersona={setPersona}
          toggleBookmarkMessage={toggleBookmarkMessage}
          sessionFiles={sessionFiles} // FORWARD SESSION FILES
        />
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative transition-all ${theme === "dark"
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-white border-zinc-200 text-zinc-900"
              }`}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-semibold text-center mb-1">
              {isSignUp ? "Create an Account" : "Welcome Back"}
            </h2>
            <p className="text-xs text-zinc-400 text-center mb-6">
              {isSignUp
                ? "Sign up to store documents and chats"
                : "Sign in to access your saved features"}
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-3 text-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-none ${theme === "dark"
                        ? "bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500"
                        : "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400"
                      }`}
                  />
                </div>
              )}

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-3 text-zinc-400"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-none ${theme === "dark"
                      ? "bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500"
                      : "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400"
                    }`}
                />
              </div>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-3 text-zinc-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-none ${theme === "dark"
                      ? "bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-500"
                      : "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder-zinc-400"
                    }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError("");
                }}
                className="text-xs text-blue-400 hover:underline cursor-pointer"
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;