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
  const [sidebarOpen, setSidebarOpen] = useState(false); // 📱 Mobile sidebar state
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

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
            text: "👋 Hey there! I'm FinVision, your personal finance assistant powered by AI. How can I help you today?",
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

  // 📱 Auto-focus input on mobile
  useEffect(() => {
    if (mounted && inputRef.current) {
      // Small delay to ensure the keyboard doesn't interfere with initial render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [mounted]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 px-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-cyan-400">
          Please Login First 💡
        </h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg text-base"
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
      
      // 📱 Refocus input after sending on mobile
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  // 🧹 Clear chat history
  const clearChat = () => {
    setMessages([
      {
        sender: "ai",
        text: "👋 Hey there! I'm FinVision, your personal finance assistant powered by AI. How can I help you today?",
      },
    ]);
    toast.success("Chat history cleared");
  };

  return (
    <div className="flex w-full">
      {/* 📱 Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar with mobile responsiveness */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onMobileClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 lg:ml-72 p-4 lg:p-6 flex flex-col h-screen bg-[#070919]">
        {/* 📱 Mobile Header with Menu Button */}
        <Header 
          subtitle="Your AI-powered financial assistant 💡" 
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* 📱 Chat Header with Clear Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-semibold text-cyan-400">
            AI Finance Assistant
          </h2>
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-all"
          >
            Clear Chat
          </button>
        </div>

        {/* 📱 Mobile-optimized Chat Window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto bg-[#0b0e20] border border-cyan-400/20 rounded-2xl p-4 lg:p-6 shadow-lg mb-4 scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge
          }}
        >
          {/* Hide scrollbar for Webkit browsers */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`my-3 flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
                  msg.sender === "user"
                    ? "bg-cyan-500 text-black rounded-br-none"
                    : "bg-[#14182b] text-gray-200 border border-cyan-400/10 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* 📱 Mobile-optimized Typing Animation */}
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 italic text-sm ml-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              FinVision is thinking...
            </div>
          )}

          <div ref={chatEndRef} className="h-4"></div>
        </motion.div>

        {/* 📱 Mobile-optimized Input Box */}
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2 bg-[#0e1121] border border-cyan-400/20 rounded-2xl lg:rounded-full p-3 lg:p-2 shadow-lg"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about spending, goals, or saving tips..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-gray-200 text-sm lg:text-base px-2 focus:outline-none placeholder-gray-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-black font-semibold px-4 lg:px-5 py-3 lg:py-2 rounded-xl lg:rounded-full transition-all hover:scale-105 active:scale-95 min-w-[60px] flex items-center justify-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Send"
            )}
          </button>
        </form>

        {/* 📱 Mobile Helper Text */}
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            💡 Try asking: "How can I save more money?" or "Analyze my spending"
          </p>
        </div>
      </main>
    </div>
  );
}