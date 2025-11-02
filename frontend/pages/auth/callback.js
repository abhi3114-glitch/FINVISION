// pages/auth/callback.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API } from "../../lib/api";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Authenticating with Google...");

  useEffect(() => {
    const checkAuth = async () => {
      if (!router.isReady) return;

      const query = new URLSearchParams(window.location.search);
      const token = query.get("token");
      const name = query.get("name");
      const email = query.get("email");
      const picture = query.get("picture");

      console.log("🌐 OAuth callback received:", { token, name, email, picture });

      if (token) {
        setStatus("Setting up your account...");
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        API.saveSession({
          access_token: token,
          user: { name, email, picture },
        });

        setStatus("Login successful! Redirecting...");
        toast.success("✅ Logged in successfully!");
        
        // Brief delay to show success message
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        setStatus("Authentication failed. Redirecting to login...");
        toast.error("❌ Authentication failed. Missing token.");
        
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    };

    checkAuth();
  }, [router.isReady]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070919] px-4">
      {/* 📱 Mobile-optimized Loading Animation */}
      <div className="text-center space-y-6">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-spin mx-auto"></div>
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        
        {/* Status Message */}
        <div className="space-y-2">
          <p className="text-gray-300 text-lg font-medium">{status}</p>
          <p className="text-gray-500 text-sm">
            {status.includes("successful") ? "🎉 Welcome to FinVision!" : "Please wait..."}
          </p>
        </div>

        {/* 📱 Progress Bar for Better UX */}
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse"
            style={{
              animation: status.includes("successful") ? "none" : "pulse 2s infinite"
            }}
          />
        </div>

        {/* 📱 Help Text for Mobile Users */}
        <div className="pt-4 border-t border-gray-800 mt-6">
          <p className="text-gray-600 text-xs">
            {status.includes("failed") 
              ? "Having trouble? Try logging in again." 
              : "This should only take a moment..."
            }
          </p>
        </div>
      </div>

      {/* 📱 Mobile-safe Area Spacer */}
      <div className="h-8"></div>
    </div>
  );
}