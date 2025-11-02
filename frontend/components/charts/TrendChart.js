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
  // 🧾 Group transactions by month
  const monthlyTotals = {};
  transactions.forEach((t) => {
    const date = new Date(t.date);
    const month = date.toLocaleString("default", { month: "short" });
    if (!monthlyTotals[month]) monthlyTotals[month] = 0;
    monthlyTotals[month] += parseFloat(t.amount);
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
      amount: monthlyTotals[m],
    }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      style={{ width: "100%", height: 260 }}
      className="relative"
    >
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
              background: "rgba(14,17,33,0.95)",
              border: "1px solid rgba(0,255,255,0.2)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.85rem",
              boxShadow: "0 0 12px rgba(0,255,255,0.2)",
            }}
            formatter={(value) => [`₹${value.toLocaleString()}`, "Total"]}
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

      {/* 🧠 Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 blur-3xl bg-gradient-to-r from-cyan-400/40 via-purple-500/40 to-transparent" />
    </motion.div>
  );
}
