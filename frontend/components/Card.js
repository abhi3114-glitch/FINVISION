import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, Wallet, PiggyBank } from "lucide-react";

export default function Card({ title, value, subtitle, icon }) {
  // pick a default icon dynamically if none provided
  const Icon =
    icon ||
    (title?.toLowerCase().includes("spent")
      ? Wallet
      : title?.toLowerCase().includes("goal")
      ? PiggyBank
      : TrendingUp);

  return (
    <motion.div
      whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(0,255,255,0.15)" }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
      className="bg-[#0e1121] border border-cyan-400/10 hover:border-cyan-400/30 backdrop-blur-xl rounded-2xl p-5 cursor-default transition-all card-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">{title}</div>
        <Icon className="w-5 h-5 text-cyan-400/80" />
      </div>

      {/* Main Value */}
      <div className="mt-3 flex items-end justify-between">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(0,255,255,0.25)]">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-400 italic">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}
