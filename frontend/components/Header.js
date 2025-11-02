import { motion } from "framer-motion";
import { API } from "../lib/api";

export default function Header({ subtitle, user, onMenuToggle, onMenuClick, onLogout, isSidebarOpen }) {
  const handleLogout = () => {
    API.logout(); // Clears token & reloads
    if (onLogout) onLogout();
  };

  // Handle menu toggle - support both prop names for backward compatibility
  const handleMenuToggle = () => {
    if (onMenuToggle) {
      onMenuToggle();
    } else if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 px-2 lg:px-0">
      {/* Left Section - Title & Menu Toggle Button */}
      <div className="flex items-center gap-4">
        {/* 📱🖥️ Menu Toggle Button - Works on both mobile and desktop */}
        <button
          onClick={handleMenuToggle}
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 p-2 rounded-md border border-gray-700 transition-colors touch-manipulation"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
        >
          {/* Hamburger icon when closed */}
          {!isSidebarOpen ? (
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            // Close/X icon when open
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        <div>
          <h2 className="text-xl lg:text-3xl font-bold">Dashboard</h2>
          <div className="text-xs lg:text-sm text-gray-400 mt-1 max-w-[200px] lg:max-w-none">
            {subtitle || "Overview of your expenses & goals"}
          </div>
        </div>
      </div>

      {/* Right Section - User Info */}
      <motion.div
        className="flex items-center gap-3 lg:gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* User Info - Hidden on mobile, visible on desktop */}
        <div className="hidden sm:block text-right">
          <div className="text-xs text-gray-400">{user?.email || "Guest"}</div>
          <div className="font-semibold text-sm lg:text-base">{user?.name || "Demo User"}</div>
        </div>

        {/* Profile Picture with Mobile Logout */}
        <div className="relative group cursor-pointer">
          <img
            src={
              user?.picture ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="Profile"
            className="w-9 h-9 lg:w-11 lg:h-11 rounded-full border border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)] object-cover transition-all duration-300 hover:scale-105"
          />

          {/* 📱 Mobile Logout Button (Always visible on mobile) */}
          <button
            onClick={handleLogout}
            className="lg:hidden absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors"
            aria-label="Logout"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* 📱 Desktop Logout Button (Hover only) */}
          <motion.button
            onClick={handleLogout}
            className="hidden lg:block absolute right-0 top-12 opacity-0 group-hover:opacity-100 transition-all bg-cyan-500 hover:bg-cyan-600 text-black font-semibold text-xs px-3 py-1 rounded-full shadow-md z-10"
            whileHover={{ scale: 1.05 }}
          >
            Logout
          </motion.button>
        </div>

        {/* 📱 Mobile User Name (Only show on small screens) */}
        <div className="sm:hidden text-right">
          <div className="text-xs font-semibold">{user?.name?.split(' ')[0] || "User"}</div>
        </div>
      </motion.div>
    </div>
  );
}