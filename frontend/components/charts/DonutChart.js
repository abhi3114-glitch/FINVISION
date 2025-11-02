import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export default function DonutChart({ transactions = [] }) {
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // 🧾 Group EXPENSES by category (filter out income)
  const categoryTotals = {};
  transactions.forEach((t) => {
    // ✅ Only include expense transactions
    if (t.type === "expense") {
      const cat = t.category || "Others";
      const amount = parseFloat(t.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    }
  });

  // Sort by value descending
  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  // 🌈 Neon gradient palette — FinVision Glow Set
  const COLORS = [
    "url(#cyanGlow)",
    "url(#purpleGlow)",
    "url(#tealGlow)",
    "url(#pinkGlow)",
    "url(#goldGlow)",
    "url(#blueGlow)",
  ];

  // 🔢 Animate total number counter
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = total / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= total) {
        start = total;
        clearInterval(timer);
      }
      setAnimatedTotal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [total]);

  // Safe number formatter
  const safeFormatNumber = (num) => {
    const number = parseFloat(num);
    return isNaN(number) ? '0' : number.toLocaleString();
  };

  // Safe percentage calculator
  const safeCalculatePercentage = (value, total) => {
    if (!total || total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative"
      style={{ width: "100%", height: "100%" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* ✨ Gradient Definitions */}
          <defs>
            <radialGradient id="cyanGlow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#00E0FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#007AFF" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="purpleGlow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#B794F6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="tealGlow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#00FFB0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00B3A4" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="pinkGlow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#FF00A8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8B008B" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="goldGlow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#FFD166" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#B37A00" stopOpacity="0.3" />
            </radialGradient>
            <radialGradient id="blueGlow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.25" />
            </radialGradient>
          </defs>

          {/* 🌀 Donut Chart - Mobile Optimized */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="none"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(0,255,255,0.2))",
                  transition: "transform 0.2s ease",
                }}
              />
            ))}
          </Pie>

          {/* 💬 Tooltip - Mobile Optimized */}
          <Tooltip
            formatter={(value, name) => [
              `₹${safeFormatNumber(value)} (${safeCalculatePercentage(value, total)}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "rgba(11, 14, 32, 0.98)",
              border: "1px solid rgba(6, 182, 212, 0.4)",
              color: "#e2e8f0",
              borderRadius: "8px",
              fontSize: "0.75rem",
              boxShadow: "0 0 12px rgba(0,255,255,0.3)",
              padding: "6px 10px",
              backdropFilter: "blur(10px)",
            }}
            itemStyle={{
              color: "#e2e8f0",
              fontSize: "0.7rem",
            }}
            labelStyle={{
              color: "#06b6d4",
              fontWeight: "bold",
              fontSize: "0.7rem",
            }}
            wrapperStyle={{
              zIndex: 50
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 🧠 Center Label - Mobile Optimized */}
      {data.length > 0 && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="text-xs text-gray-400 mb-1">Total Spent</div>
          <motion.div
            key={animatedTotal}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-base lg:text-lg font-semibold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 text-transparent bg-clip-text break-all"
          >
            ₹{safeFormatNumber(animatedTotal)}
          </motion.div>
          <div className="text-xs text-gray-500 mt-1">
            {data.length} {data.length === 1 ? 'category' : 'categories'}
          </div>
        </motion.div>
      )}

      {/* 🌌 Empty State - Mobile Optimized */}
      {data.length === 0 && (
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-2xl lg:text-4xl mb-1 lg:mb-2">📊</div>
          <div className="text-xs lg:text-sm text-center">No expense data</div>
          <div className="text-xs text-gray-600 mt-1 text-center hidden xs:block">
            Add expense transactions to see breakdown
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}