import { motion } from "framer-motion";
import { API } from "../lib/api";

export default function Header({ subtitle, user }) {
  const handleLogout = () => {
    API.logout(); // Clears token & reloads
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left Section */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <div className="text-sm text-gray-400 mt-1">
          {subtitle || "Overview of your expenses & goals"}
        </div>
      </div>

      {/* Right Section - User Info */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-right">
          <div className="text-xs text-gray-400">{user?.email || "Guest"}</div>
          <div className="font-semibold">{user?.name || "Demo User"}</div>
        </div>

        {/* Profile Picture + Logout */}
        <div className="relative group cursor-pointer">
          <img
            src={
              user?.picture ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="Profile"
            className="w-11 h-11 rounded-full border border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)] object-cover transition-all duration-300 hover:scale-105"
          />

          {/* Logout button on hover */}
          <motion.button
            onClick={handleLogout}
            className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 transition-all bg-cyan-500 hover:bg-cyan-600 text-black font-semibold text-xs px-3 py-1 rounded-full shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
