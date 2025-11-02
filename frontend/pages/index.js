import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Dashboard from "../components/Dashboard";
import { API } from "../lib/api";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = API.getToken();

    // 🚪 Redirect to login if no token
    if (!token) {
      router.push("/login");
      return;
    }

    // 👤 Fetch current user profile
    async function loadUser() {
      try {
        const res = await API.get("/api/user/me");
        setUser(res);
      } catch (err) {
        console.error("User fetch failed:", err);
        toast.error("Session expired. Please log in again.");
        API.logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#070919]">
        <div className="text-center">
          {/* 📱 MOBILE-OPTIMIZED LOADING SPINNER */}
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg px-4">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2 px-4">Please wait while we prepare your financial overview</p>
        </div>
      </div>
    );

  return <Dashboard user={user} />;
}