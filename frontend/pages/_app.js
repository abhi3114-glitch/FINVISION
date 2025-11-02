import "../styles/globals.css";
import { AnimatePresence } from "framer-motion";
import BackgroundEffect from "../components/BackgroundEffect";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { API } from "../lib/api";
import Head from "next/head";

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
    <>
      <Head>
        {/* 🎯 MOBILE VIEWPORT FIX */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#070919" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      
      <AnimatePresence mode="wait">
        <div className="min-h-screen bg-[#070919] text-white font-poppins relative overflow-hidden">
          {/* ✨ Subtle glowing animated background - Mobile Optimized */}
          <BackgroundEffect />

          {/* 🔔 Toast notifications - Mobile Optimized */}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#0e1121",
                color: "#fff",
                border: "1px solid rgba(0,255,255,0.2)",
                boxShadow: "0 0 15px rgba(0,255,255,0.1)",
                fontSize: "0.9rem",
                maxWidth: "90vw",
                margin: "0 auto",
                borderRadius: "12px",
              },
              duration: 4000,
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
    </>
  );
}