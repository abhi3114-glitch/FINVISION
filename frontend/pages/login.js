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
    <div className="relative flex flex-col items-center justify-center h-screen text-white overflow-hidden">
      {/* ✨ Background Glow Animation */}
      <BackgroundEffect />

      {/* 🩵 Overlay gradient tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[#070919] z-0" />

      {/* 🌟 Main Login Card */}
      <motion.div
        className="relative z-10 text-center p-10 rounded-3xl border border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.1)] bg-[#0b0e20]/60 backdrop-blur-md max-w-md w-[90%]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* 💎 Branding */}
        <motion.h1
          className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text mb-2 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          FinVision
        </motion.h1>
        <p className="text-gray-400 mb-8 text-sm tracking-wide">
          Your Smart AI-Powered Expense Tracker
        </p>

        {/* 🔐 Google Login Button */}
        <motion.button
          onClick={handleGoogleLogin}
          disabled={loading}
          whileHover={!loading ? { scale: 1.05 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className={`flex items-center justify-center gap-3 font-semibold py-3 px-6 rounded-full w-full transition-all duration-300 relative overflow-hidden
            ${
              loading
                ? "bg-cyan-700 text-black cursor-not-allowed shadow-[0_0_25px_rgba(0,255,255,0.4)] animate-pulse"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_25px_rgba(0,255,255,0.5)] hover:shadow-[0_0_35px_rgba(0,255,255,0.7)]"
            }`}
        >
          {loading ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"
                transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
              />
              <span>Redirecting...</span>

              {/* 💫 Pulsing glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-30 bg-cyan-400 blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
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
                className="w-5 h-5"
              />
              Sign in with Google
            </>
          )}
        </motion.button>
      </motion.div>

      {/* 🪶 Footer */}
      <motion.div
        className="absolute bottom-6 text-gray-500 text-xs tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        © {new Date().getFullYear()} FinVision. Built with 💙 by Abhishek.
      </motion.div>
    </div>
  );
}
