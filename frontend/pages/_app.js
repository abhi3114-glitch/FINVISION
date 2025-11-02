import "../styles/globals.css";
import { AnimatePresence } from "framer-motion";
import BackgroundEffect from "../components/BackgroundEffect";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { API } from "../lib/api";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const publicRoutes = ["/login", "/auth/callback"];
    const isPublic = publicRoutes.includes(router.pathname);

    // ✅ Protect all non-public routes
    if (!isPublic) {
      const token = API.getToken();
      if (!token) {
        router.push("/login");
      }
    }
  }, [router.pathname]);

  return (
    <AnimatePresence mode="wait">
      <div className="min-h-screen bg-[#070919] text-white font-poppins relative overflow-hidden">
        {/* ✨ Subtle glowing animated background */}
        <BackgroundEffect />

        {/* 🔔 Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0e1121",
              color: "#fff",
              border: "1px solid rgba(0,255,255,0.2)",
              boxShadow: "0 0 15px rgba(0,255,255,0.1)",
              fontSize: "0.9rem",
            },
            success: {
              iconTheme: {
                primary: "#00E0FF",
                secondary: "#0e1121",
              },
            },
            error: {
              iconTheme: {
                primary: "#FF006A",
                secondary: "#0e1121",
              },
            },
          }}
        />

        {/* 🧠 Render main page */}
        <Component {...pageProps} />
      </div>
    </AnimatePresence>
  );
}
