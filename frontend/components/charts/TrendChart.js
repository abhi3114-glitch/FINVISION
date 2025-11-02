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
      style={{ width: "100%", height: "100%" }}
      className="relative"
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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

            {/* ✨ Grid & Axes - Mobile Optimized */}
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={2}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={35}
              tickFormatter={(value) => {
                if (value >= 1000) return `₹${(value/1000).toFixed(0)}k`;
                return `₹${value}`;
              }}
            />

            {/* 💬 Tooltip - Mobile Optimized */}
            <Tooltip
              contentStyle={{
                background: "rgba(11, 14, 32, 0.98)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "0.75rem",
                boxShadow: "0 0 12px rgba(0,255,255,0.3)",
                padding: "6px 10px",
                backdropFilter: "blur(10px)",
              }}
              formatter={(value) => [`₹${safeFormatNumber(value)}`, "Spent"]}
              labelStyle={{
                color: "#06b6d4",
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
              wrapperStyle={{
                zIndex: 50
              }}
            />

            {/* 🌊 Smooth Filled Gradient Area */}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="none"
              fill="url(#fillGradient)"
            />

            {/* ⚡ Glowing Line - Mobile Optimized */}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              dot={{
                r: 2,
                fill: "#00E0FF",
                stroke: "#7B2FF7",
                strokeWidth: 1,
              }}
              activeDot={{
                r: 4,
                fill: "#00E0FF",
                stroke: "#7B2FF7",
                strokeWidth: 2,
              }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        // 📊 Empty State - Mobile Optimized
        <motion.div 
          className="flex flex-col items-center justify-center h-full text-gray-500 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-2xl lg:text-4xl mb-1 lg:mb-2">📈</div>
          <div className="text-xs lg:text-sm text-center">No expense trend data</div>
          <div className="text-xs text-gray-600 mt-1 text-center hidden xs:block">
            Add expense transactions to see trends
          </div>
        </motion.div>
      )}

      {/* 🧠 Glow Overlay (only when data exists) - Mobile Optimized */}
      {hasData && (
        <div className="absolute inset-0 pointer-events-none opacity-15 lg:opacity-20 blur-2xl lg:blur-3xl bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-transparent" />
      )}
    </motion.div>
  );
}