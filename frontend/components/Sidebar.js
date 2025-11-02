import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { API } from "../lib/api";
import { useState, useEffect, useRef } from "react";

export default function Sidebar({ onMobileClose, isOpen = true }) {
  const router = useRouter();
  const user = API.getUser();
  const [aiThinking, setAiThinking] = useState(false);
  const closeButtonRef = useRef(null);

  // 💡 Listen to Gemini "thinking" state from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const state = localStorage.getItem("finvision_ai_thinking");
      setAiThinking(state === "true");
    };

    // Check initial state
    handleStorageChange();

    // Set up polling to check localStorage changes in the same window
    const pollInterval = setInterval(handleStorageChange, 500);

    // Also listen to storage events from other tabs
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 📱 Handle navigation with mobile close
  const handleNavigation = (path) => {
    router.push(path);
    if (onMobileClose && window.innerWidth < 1024) {
      console.log("🔄 NAVIGATION - Closing sidebar");
      setTimeout(() => onMobileClose(), 100); // Small delay to ensure smooth transition
    }
  };

  // 📱 Simple and reliable close handler for mobile Chrome
  const handleClose = (e) => {
    console.log('🔄 Close button clicked!');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // IMMEDIATE execution - no delays, no wrappers
    if (onMobileClose) {
      console.log('🔄 Calling onMobileClose function');
      // Call directly - this should work immediately
      try {
        onMobileClose();
        console.log('✅ onMobileClose called successfully');
      } catch (err) {
        console.error('❌ Error closing sidebar:', err);
      }
    } else {
      console.error('❌ onMobileClose is not available!');
    }
  };

  // Touch handler specifically for mobile Chrome - use onTouchEnd for reliability
  const handleTouch = (e) => {
    console.log('📱 Touch end event fired!');
    // Prevent all default behaviors
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    
    // IMMEDIATE call
    if (onMobileClose) {
      console.log('📱 Calling onMobileClose from touch handler');
      try {
        onMobileClose();
        console.log('✅ onMobileClose called successfully from touch');
      } catch (err) {
        console.error('❌ Error closing sidebar from touch:', err);
      }
    } else {
      console.error('❌ onMobileClose is not available in touch handler!');
    }
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
    <>
      {/* 📱🖥️ Sidebar Container - Responsive for mobile and desktop */}
      <aside 
        className={`
          w-72 lg:w-72 h-screen fixed left-0 top-0 flex flex-col p-4 lg:p-6 border-r border-white/10 z-[1000] 
          bg-[#0b0f1a]/95 backdrop-blur-md overflow-y-auto
          lg:relative lg:z-auto
        `}
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 📱 Mobile Header with Close Button */}
        <div className="flex items-center justify-between mb-6 lg:mb-8 relative" style={{ pointerEvents: 'auto' }}>
          <div className="flex-1">
            <div className="text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
              FinVision
            </div>
            <div className="text-xs text-gray-400 mt-1">Smart Expense Tracker</div>
          </div>
          
          {/* 📱 Mobile Close Button - Only visible on mobile - Mobile Chrome Fixed */}
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            onTouchEnd={handleTouch}
            onTouchStart={(e) => {
              // Don't prevent default on touchStart - only stop propagation
              e.stopPropagation();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="lg:hidden bg-red-500 hover:bg-red-600 active:bg-red-700 p-4 rounded-lg border-2 border-red-300 transition-all touch-manipulation ml-2 flex-shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              touchAction: 'manipulation',
              cursor: 'pointer',
              userSelect: 'none',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10001,
              msTouchAction: 'manipulation',
              isolation: 'isolate'
            }}
            aria-label="Close menu"
            type="button"
          >
            <svg className="w-7 h-7 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 🔹 Navigation Menu */}
        <nav className="mt-4 lg:mt-6 space-y-1 lg:space-y-2 flex-1">
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
                onClick={() => handleNavigation(item.path)}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }} // 📱 Mobile tap feedback
                className={`flex items-center gap-3 text-base lg:text-md py-3 lg:py-2 px-3 rounded-lg lg:rounded-md cursor-pointer transition-all touch-manipulation ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                    : "text-gray-300 hover:text-cyan-300 hover:bg-white/5"
                } ${glowing}`}
              >
                {/* 📱 Mobile Icons */}
                <div className="w-5 h-5 flex items-center justify-center lg:hidden">
                  {item.path === "/" && (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {item.path === "/transactions" && (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  {item.path === "/goals" && (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.path === "/analytics" && (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {item.path === "/aichat" && (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                  {item.path === "/settings" && (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                
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
    </>
  );
}