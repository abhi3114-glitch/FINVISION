import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import { motion } from "framer-motion";

export default function TrendChart({ transactions = [] }) {
  // 🧾 Group EXPENSE transactions by month (filter out income)
  const monthlyTotals = {};
  transactions.forEach((t) => {
    // ✅ Only include expense transactions
    if (t.type === "expense") {
      const date = new Date(t.date);
      const month = date.toLocaleString("default", { month: "short" });
      const amount = parseFloat(t.amount) || 0;
      monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
    }
  });

  // Sort by month order
  const monthsOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const data = monthsOrder
    .filter((m) => monthlyTotals[m])
    .map((m) => ({
      name: m,
      amount: monthlyTotals[m] || 0,
    }));

  // Safe number formatter
  const safeFormatNumber = (num) => {
    const number = parseFloat(num);
    return isNaN(number) ? '0' : number.toLocaleString();
  };

  // Check if we have any data to display
  const hasData = data.length > 0 && data.some(item => item.amount > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      style={{ width: "100%", height: 260 }}
      className="relative"
    >
      {hasData ? (
        <ResponsiveContainer>
          <LineChart data={data}>
            {/* 🌈 Neon Gradient Definitions */}
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E0FF" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#7B2FF7" stopOpacity={0.3} />
              </linearGradient>

              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,224,255,0.25)" />
                <stop offset="100%" stopColor="rgba(123,47,247,0.05)" />
              </linearGradient>
            </defs>

            {/* ✨ Grid & Axes */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            {/* 💬 Tooltip */}
            <Tooltip
              contentStyle={{
                background: "rgba(11, 14, 32, 0.95)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                boxShadow: "0 0 12px rgba(0,255,255,0.2)",
                padding: "8px 12px",
              }}
              formatter={(value) => [`₹${safeFormatNumber(value)}`, "Spent"]}
              labelStyle={{
                color: "#06b6d4",
                fontWeight: "bold",
                fontSize: "0.8rem",
              }}
            />

            {/* 🌊 Smooth Filled Gradient Area */}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="none"
              fill="url(#fillGradient)"
            />

            {/* ⚡ Glowing Line */}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#00E0FF",
                stroke: "#7B2FF7",
                strokeWidth: 2,
              }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        // 📊 Empty State
        <motion.div 
          className="flex flex-col items-center justify-center h-full text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-4xl mb-2">📈</div>
          <div>No expense trend data</div>
          <div className="text-xs text-gray-600 mt-1">Add expense transactions to see spending trends</div>
        </motion.div>
      )}

      {/* 🧠 Glow Overlay (only when data exists) */}
      {hasData && (
        <div className="absolute inset-0 pointer-events-none opacity-20 blur-3xl bg-gradient-to-r from-cyan-400/40 via-purple-500/40 to-transparent" />
      )}
    </motion.div>
  );
}