import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { API } from "../lib/api";
import toast from "react-hot-toast";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const u = API.getUser();
    if (u) setUser(u);
  }, []);

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-3xl font-semibold text-cyan-400">
          Please Login First 💡
        </h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-full transition-all hover:scale-105 shadow-lg"
        >
          Login with Google
        </button>
      </div>
    );

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-72 flex-1 p-10">
        <Header subtitle="Manage your account preferences" user={user} />

        <div className="bg-[#0b0e20] p-8 rounded-2xl border border-cyan-500/20 shadow-md max-w-xl mx-auto mt-10 space-y-6">
          <h2 className="text-xl font-semibold text-cyan-400">Profile</h2>
          <div className="flex items-center gap-4">
            <img
              src={user.picture}
              alt="Profile"
              className="w-16 h-16 rounded-full border border-cyan-500"
            />
            <div>
              <p className="text-gray-200 text-lg font-semibold">{user.name}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          <hr className="border-gray-700" />

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Dark Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all"></div>
            </label>
          </div>

          <button
            onClick={() => {
              API.logout();
              toast.success("Logged out successfully!");
              window.location.href = "/";
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md py-2 px-4 mt-4 transition-all w-full"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
