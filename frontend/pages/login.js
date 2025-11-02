import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackgroundEffect from "../components/BackgroundEffect";
import { API } from "../lib/api";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🚀 Redirect if already logged in
  useEffect(() => {
    const token = API.getToken();
    if (token) router.push("/");
  }, []);

  // 🔐 Handle Google Login
  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      API.loginWithGoogle();
    }, 600);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-white overflow-hidden px-4">
      {/* ✨ Background Glow Animation */}
      <BackgroundEffect />

      {/* 🩵 Overlay gradient tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[#070919] z-0" />

      {/* 🌟 Main Login Card - Mobile Optimized */}
      <motion.div
        className="relative z-10 text-center p-6 lg:p-10 rounded-3xl border border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.1)] bg-[#0b0e20]/80 backdrop-blur-md w-full max-w-sm lg:max-w-md mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* 💎 Branding - Mobile Optimized */}
        <motion.h1
          className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text mb-2 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          FinVision
        </motion.h1>
        <p className="text-gray-400 mb-6 lg:mb-8 text-sm tracking-wide">
          Your Smart AI-Powered Expense Tracker
        </p>

        {/* 🔐 Google Login Button - Mobile Optimized */}
        <motion.button
          onClick={handleGoogleLogin}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.95 } : {}}
          className={`flex items-center justify-center gap-3 font-semibold py-4 lg:py-3 px-6 rounded-full w-full transition-all duration-300 relative overflow-hidden text-base lg:text-sm
            ${
              loading
                ? "bg-cyan-700 text-black cursor-not-allowed shadow-[0_0_20px_rgba(0,255,255,0.4)] animate-pulse"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_25px_rgba(0,255,255,0.7)] active:bg-cyan-600"
            }`}
        >
          {loading ? (
            <>
              <motion.div
                className="w-5 h-5 lg:w-4 lg:h-4 border-2 border-black border-t-transparent rounded-full animate-spin"
                transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
              />
              <span>Redirecting...</span>

              {/* 💫 Pulsing glow ring - Mobile Optimized */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-20 lg:opacity-30 bg-cyan-400 blur-xl lg:blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          ) : (
            <>
              <img
                src="https://cdn-icons-png.flaticon.com/512/281/281764.png"
                alt="Google"
                className="w-6 h-6 lg:w-5 lg:h-5"
              />
              <span>Sign in with Google</span>
            </>
          )}
        </motion.button>

        {/* 📱 Mobile Features Preview */}
        <motion.div
          className="mt-6 lg:mt-8 grid grid-cols-2 gap-3 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span>AI Insights</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Smart Tracking</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Real-time Analytics</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Goal Setting</span>
          </div>
        </motion.div>
      </motion.div>

      {/* 📱 Mobile Demo Access (Optional) */}
      <motion.div
        className="relative z-10 mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <button
          onClick={() => router.push("/demo")}
          className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors"
        >
          Try Demo Version
        </button>
      </motion.div>

      {/* 🪶 Footer - Mobile Optimized */}
      <motion.div
        className="absolute bottom-4 lg:bottom-6 text-gray-500 text-xs tracking-wide text-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p>© {new Date().getFullYear()} FinVision</p>
        <p className="text-gray-600 mt-1">Built with 💙 by Abhishek</p>
      </motion.div>

      {/* 📱 Mobile Safe Area Spacer */}
      <div className="h-8 lg:hidden"></div>
    </div>
  );
}