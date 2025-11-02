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
      <div className="h-screen flex items-center justify-center text-gray-400 text-lg">
        Loading your dashboard...
      </div>
    );

  return <Dashboard user={user} />;
}
