import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { API } from "../lib/api";
import toast from "react-hot-toast";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // 📱 Mobile sidebar state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = API.getUser();
    if (u) setUser(u);
  }, []);

  if (!mounted) return null;

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 px-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-cyan-400">
          Please Login First 💡
        </h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg text-base"
        >
          Login with Google
        </button>
      </div>
    );

  return (
    <div className="flex w-full">
      {/* 📱 Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar with mobile responsiveness */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onMobileClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 lg:ml-72 p-4 lg:p-10 relative min-h-screen">
        {/* 📱 Mobile Header with Menu Button */}
        <Header 
          subtitle="Manage your account preferences" 
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* 📱 Mobile-optimized Settings Card */}
        <div className="bg-[#0b0e20] p-6 lg:p-8 rounded-2xl border border-cyan-500/20 shadow-md w-full max-w-xl mx-auto mt-6 lg:mt-10 space-y-6 lg:space-y-8">
          {/* Profile Section */}
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-cyan-400 mb-4 lg:mb-6">
              Profile Settings
            </h2>
            
            {/* 📱 Mobile-optimized Profile Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
              <img
                src={user.picture}
                alt="Profile"
                className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-cyan-500 object-cover"
              />
              <div className="text-center sm:text-left flex-1">
                <p className="text-gray-200 text-base lg:text-lg font-semibold truncate">
                  {user.name}
                </p>
                <p className="text-gray-400 text-sm lg:text-base truncate mt-1">
                  {user.email}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Account connected via Google
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-700" />

          {/* 📱 Mobile-optimized Settings Options */}
          <div className="space-y-4 lg:space-y-6">
            {/* Dark Mode Toggle */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-gray-300 text-sm lg:text-base block">Dark Mode</span>
                <span className="text-gray-500 text-xs">Toggle dark/light theme</span>
              </div>
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

            {/* Notifications Setting */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-gray-300 text-sm lg:text-base block">Email Notifications</span>
                <span className="text-gray-500 text-xs">Receive financial insights</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all"></div>
              </label>
            </div>

            {/* Currency Setting */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-gray-300 text-sm lg:text-base block">Currency</span>
                <span className="text-gray-500 text-xs">Display currency format</span>
              </div>
              <select className="bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-cyan-400">
                <option>Indian Rupee (₹)</option>
                <option>US Dollar ($)</option>
                <option>Euro (€)</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-700" />

          {/* 📱 Mobile-optimized Danger Zone */}
          <div className="space-y-4">
            <h3 className="text-red-400 font-semibold text-sm lg:text-base">Danger Zone</h3>
            
            {/* Export Data */}
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg py-3 px-4 transition-all active:scale-95 text-sm lg:text-base">
              📥 Export Financial Data
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                API.logout();
                toast.success("Logged out successfully!");
                window.location.href = "/";
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg py-3 px-4 transition-all active:scale-95 text-sm lg:text-base"
            >
              🚪 Logout from FinVision
            </button>

            {/* Delete Account (Hidden on mobile, visible on desktop) */}
            <button className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 font-medium rounded-lg py-3 px-4 transition-all active:scale-95 text-sm lg:text-base border border-red-500/30">
              🗑️ Delete Account
            </button>
          </div>

          {/* 📱 Mobile Footer Info */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs">
              FinVision v1.0 • Your privacy matters
            </p>
          </div>
        </div>

        {/* 📱 Mobile Help Text */}
        <div className="text-center mt-6 lg:mt-8 px-4">
          <p className="text-gray-500 text-sm">
            💡 Need help? Contact support at support@finvision.app
          </p>
        </div>
      </main>
    </div>
  );
}