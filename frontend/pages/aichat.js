import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { API } from "../lib/api";
import toast from "react-hot-toast";

export default function AiChat() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ✅ Load user and saved chat after client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
      const storedUser = API.getUser();
      if (storedUser) setUser(storedUser);

      const saved = localStorage.getItem("finvision_chat");
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          {
            sender: "ai",
            text: "👋 Hey there! I’m FinVision, your personal finance assistant powered by AI. How can I help you today?",
          },
        ]);
      }
    }
  }, []);

  // 🧠 Auto-scroll + persist chat
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      localStorage.setItem("finvision_chat", JSON.stringify(messages));
    }
  }, [messages, mounted]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-3xl font-semibold text-cyan-400">
          Please Login First 💡
        </h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-full transition-all hover:scale-105 shadow-lg"
        >
          Login with Google
        </button>
      </div>
    );
  }

  // 💬 Send message to AI (Hugging Face Backend)
  async function sendMessage(e) {
    e.preventDefault();
    const userText = input.trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      localStorage.setItem("finvision_ai_thinking", "true");

      const res = await API.post("/api/ai/chat", { message: userText });

      localStorage.setItem("finvision_ai_thinking", "false");

      // 🧠 Normalize backend response safely
      let aiReply = res?.reply || res?.text || "🤖 No response from AI.";
      if (typeof aiReply === "object") {
        aiReply =
          aiReply.error ||
          aiReply.reply ||
          "⚠️ AI returned an unexpected format.";
      }

      // ✅ Always cast to string
      if (typeof aiReply !== "string") {
        aiReply = JSON.stringify(aiReply);
      }

      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      toast.error("Failed to reach AI assistant");
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
      localStorage.setItem("finvision_ai_thinking", "false");
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-72 flex-1 p-10 flex flex-col h-screen">
        <Header subtitle="Your AI-powered financial assistant 💡" user={user} />

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto bg-[#0b0e20] border border-cyan-400/20 rounded-2xl p-6 shadow-lg mb-4 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`my-2 flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-cyan-500 text-black rounded-br-none"
                    : "bg-[#14182b] text-gray-200 border border-cyan-400/10 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing Animation */}
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 italic text-sm ml-2 mt-2">
              FinVision is thinking
              <span className="flex space-x-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-200">.</span>
                <span className="animate-bounce delay-400">.</span>
              </span>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </motion.div>

        {/* Input Box */}
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-3 bg-[#0e1121] border border-cyan-400/20 rounded-full p-2"
        >
          <input
            type="text"
            placeholder="Ask me anything about your spending, goals, or saving tips..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-gray-200 text-sm px-4 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-5 py-2 rounded-full transition-all hover:scale-105"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}
