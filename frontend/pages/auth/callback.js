// pages/auth/callback.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { API } from "../../lib/api";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const router = useRouter();

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
        API.saveSession({
          access_token: token,
          user: { name, email, picture },
        });

        toast.success("✅ Logged in successfully!");
        router.push("/");
      } else {
        toast.error("❌ Authentication failed. Missing token.");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router.isReady]);

  return (
    <div className="h-screen flex items-center justify-center text-gray-400 text-lg">
      Authenticating with Google...
    </div>
  );
}
