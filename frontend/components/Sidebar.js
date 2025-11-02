import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { API } from "../lib/api";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const router = useRouter();
  const user = API.getUser();
  const [aiThinking, setAiThinking] = useState(false);

  // 💡 Listen to Gemini “thinking” state from localStorage (set by AiChat.js)
  useEffect(() => {
    const handleStorageChange = () => {
      const state = localStorage.getItem("finvision_ai_thinking");
      setAiThinking(state === "true");
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange(); // initial check
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const items = [
    { label: "Dashboard", path: "/" },
    { label: "Transactions", path: "/transactions" },
    { label: "Goals", path: "/goals" },
    { label: "Analytics", path: "/analytics" },
    { label: "AI Chat", path: "/aichat" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 blur-bg flex flex-col p-6 border-r border-white/10 z-20 bg-[#0b0f1a]/90 backdrop-blur-md">
      {/* 🔹 App Name */}
      <div className="mb-8">
        <div className="text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
          FinVision
        </div>
        <div className="text-xs text-gray-400 mt-1">Smart Expense Tracker</div>
      </div>

      {/* 🔹 Navigation Menu */}
      <nav className="mt-6 space-y-2 flex-1">
        {items.map((item) => {
          const isActive = router.pathname === item.path;
          const isAiChat = item.path === "/aichat";

          // 💫 Glow pulse animation when Gemini is active
          const glowing =
            isAiChat && (isActive || aiThinking)
              ? "animate-pulse-glow text-cyan-300"
              : "";

          return (
            <motion.div
              key={item.label}
              onClick={() => router.push(item.path)}
              whileHover={{ x: 6 }}
              className={`flex items-center gap-2 text-md py-2 px-3 rounded-md cursor-pointer transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                  : "text-gray-300 hover:text-cyan-300 hover:bg-white/5"
              } ${glowing}`}
            >
              <span>{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="activeItem"
                  className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* 🔹 User Section */}
      <div className="mt-auto border-t border-white/10 pt-4 flex items-center gap-3">
        <img
          src={
            user?.picture ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt="User"
          className="w-10 h-10 rounded-full border border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.2)] object-cover"
        />
        <div>
          <div className="text-sm font-semibold text-white">
            {user?.name || "Demo User"}
          </div>
          <div className="text-xs text-gray-400">
            {user?.email || "demo@example.com"}
          </div>
        </div>
      </div>

      {/* 🔹 Footer */}
      <div className="mt-4 text-gray-500 text-xs text-center">
        v1.0 • Connected
      </div>

      {/* ✨ Custom Glow Animation */}
      <style jsx>{`
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.3),
              0 0 20px rgba(168, 85, 247, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.6),
              0 0 30px rgba(168, 85, 247, 0.5);
          }
          100% {
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.3),
              0 0 20px rgba(168, 85, 247, 0.2);
          }
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s infinite ease-in-out;
        }
      `}</style>
    </aside>
  );
}
