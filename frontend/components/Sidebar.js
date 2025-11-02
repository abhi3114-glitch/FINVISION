import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { API } from "../lib/api";
import { useState, useEffect } from "react";

export default function Sidebar({ onMobileClose, isOpen = true }) {
  const router = useRouter();
  const user = API.getUser();
  const [aiThinking, setAiThinking] = useState(false);

  // 💡 Listen to Gemini "thinking" state from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const state = localStorage.getItem("finvision_ai_thinking");
      setAiThinking(state === "true");
    };

    handleStorageChange();
    const poll = setInterval(handleStorageChange, 500);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(poll);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 📱 Handle navigation with mobile close
  const handleNavigation = (path) => {
    router.push(path);
    if (onMobileClose && window.innerWidth < 1024) {
      setTimeout(() => onMobileClose(), 150);
    }
  };

  // 📱 Handle close button
  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMobileClose && typeof onMobileClose === "function") {
      onMobileClose();
    }
  };

  // Animation variants
  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 90, damping: 14 },
    },
    exit: {
      x: "-100%",
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const items = [
    { label: "Dashboard", path: "/" },
    { label: "Transactions", path: "/transactions" },
    { label: "Goals", path: "/goals" },
    { label: "Analytics", path: "/analytics" },
    { label: "AI Chat", path: "/aichat" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="sidebar"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-72 lg:w-72 h-screen fixed left-0 top-0 flex flex-col p-4 lg:p-6 border-r border-white/10 z-[999] bg-[#0b0f1a]/95 backdrop-blur-md overflow-y-auto"
        >
          {/* 📱 Header */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <div className="text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
                FinVision
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Smart Expense Tracker
              </div>
            </div>

            {/* ❌ Close Button */}
            <button
              onClick={handleClose}
              onTouchEnd={handleClose}
              className="lg:hidden bg-red-500 hover:bg-red-600 active:bg-red-700 p-2 rounded-md border border-red-300 transition-colors z-[9999]"
              aria-label="Close menu"
              type="button"
            >
              <svg
                className="w-5 h-5 text-white pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 🔹 Navigation Menu */}
          <nav className="mt-4 lg:mt-6 space-y-1 lg:space-y-2 flex-1">
            {items.map((item) => {
              const isActive = router.pathname === item.path;
              const isAiChat = item.path === "/aichat";
              const glowing =
                isAiChat && (isActive || aiThinking)
                  ? "animate-pulse-glow text-cyan-300"
                  : "";

              return (
                <motion.div
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 text-base lg:text-md py-3 lg:py-2 px-3 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                      : "text-gray-300 hover:text-cyan-300 hover:bg-white/5"
                  } ${glowing}`}
                >
                  <span className="text-sm lg:text-md">{item.label}</span>
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
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.2)] object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user?.name || "Demo User"}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email || "demo@example.com"}
              </div>
            </div>
          </div>

          <div className="mt-4 text-gray-500 text-xs text-center">
            v1.0 • Connected
          </div>

          {/* ✨ Glow Animation */}
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
