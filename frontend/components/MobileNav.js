import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../lib/api";

export default function MobileNav() {
  const router = useRouter();
  const [aiThinking, setAiThinking] = useState(false);

  // Listen to Gemini "thinking" state
  useEffect(() => {
    const handleStorageChange = () => {
      const state = localStorage.getItem("finvision_ai_thinking");
      setAiThinking(state === "true");
    };
    handleStorageChange();
    const pollInterval = setInterval(handleStorageChange, 500);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: "Transactions", path: "/transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Goals", path: "/goals", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Analytics", path: "/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { label: "AI Chat", path: "/aichat", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
    { label: "Settings", path: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  const handleNav = (path) => {
    router.push(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0b0f1a]/95 backdrop-blur-md border-t border-white/10 z-[1000] px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = router.pathname === item.path;
          const isAiChat = item.path === "/aichat";
          const glowing = isAiChat && (isActive || aiThinking);

          return (
            <motion.button
              key={item.path}
              onClick={() => handleNav(item.path)}
              whileTap={{ scale: 0.9 }}
              className={`
                flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all
                min-w-[50px] touch-manipulation
                ${isActive
                  ? "bg-gradient-to-b from-cyan-500/30 to-blue-600/20 text-cyan-300"
                  : "text-gray-400 hover:text-cyan-300"
                }
                ${glowing ? "animate-pulse" : ""}
              `}
              aria-label={item.label}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isActive ? 2.5 : 2}
                  d={item.icon}
                />
              </svg>
              <span className="text-[10px] font-medium leading-tight">
                {item.label === "Dashboard" ? "Home" : item.label.length > 8 ? item.label.slice(0, 8) : item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

