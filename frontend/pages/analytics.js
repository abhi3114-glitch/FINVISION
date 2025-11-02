import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { API } from "../lib/api";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [forecast, setForecast] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // 🧭 Filters
  const [category, setCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("this_month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const COLORS = [
    "#06b6d4",
    "#34d399",
    "#f87171",
    "#fbbf24",
    "#a78bfa",
    "#60a5fa",
    "#f472b6",
    "#94a3b8",
  ];

  // 📅 Date range utility
  function getDateParams() {
    const today = new Date();
    let start = "", end = "";
    if (timeRange === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
    } else if (timeRange === "last_month") {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = lastMonth.toISOString().split("T")[0];
      end = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split("T")[0];
    } else if (timeRange === "this_year") {
      start = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
      end = new Date(today.getFullYear(), 11, 31).toISOString().split("T")[0];
    } else if (timeRange === "custom") {
      start = customRange.start;
      end = customRange.end;
    }
    return { start, end };
  }

  // 🔄 Load user, transactions, and summary with filters
  async function fetchData() {
    try {
      setLoading(true);
      const u = API.getUser();
      setUser(u);

      const { start, end } = getDateParams();
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (start) params.append("start", start);
      if (end) params.append("end", end);
      const query = params.toString() ? `?${params.toString()}` : "";

      const [tx, sum] = await Promise.all([
        API.get(`/api/transactions${query}`),
        API.get(`/api/summary${query}`),
      ]);
      setTransactions(tx);
      setSummary(sum);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  // 🧠 Fetch AI forecast with filters
  async function loadForecast() {
    try {
      setAiLoading(true);
      const { start, end } = getDateParams();
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (start) params.append("start", start);
      if (end) params.append("end", end);
      const query = params.toString() ? `?${params.toString()}` : "";

      const res = await API.get(`/api/ai/spending_forecast${query}`);
      if (res?.reply) setForecast(res.reply);
      else if (typeof res === "string") setForecast(res);
      else setForecast("AI did not return a readable forecast.");
    } catch (err) {
      console.error("AI Forecast Error:", err);
      toast.error("Failed to fetch AI forecast");
    } finally {
      setAiLoading(false);
    }
  }

  // 🧭 Initial load + auto forecast
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      loadForecast();
    }
  }, [category, timeRange, customRange]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Loading Analytics...
      </div>
    );

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

  // 📊 Prepare chart data
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + parseFloat(t.amount);
    return acc;
  }, {});
  const barData = Object.keys(monthlyData).map((m) => ({
    month: m,
    total: monthlyData[m],
  }));

  const categoryData = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
  }, {});
  const pieData = Object.keys(categoryData).map((k) => ({
    name: k,
    value: categoryData[k],
  }));

  const topCategory =
    pieData.length > 0
      ? pieData.sort((a, b) => b.value - a.value)[0].name
      : "N/A";

  const avgPerDay = (summary.total / 30).toFixed(2);

  const tooltipStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(6,182,212,0.5)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "13px",
    padding: "8px 10px",
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-72 flex-1 p-10">
        <Header
          subtitle="Visualize your spending patterns and insights"
          user={user}
        />

        {/* 🔍 Filters */}
        <div className="flex items-center gap-4 mb-8">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-800 text-gray-200 px-3 py-2 rounded-md border border-gray-700 focus:border-cyan-400"
          >
            <option>All</option>
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Entertainment</option>
            <option>Other</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-800 text-gray-200 px-3 py-2 rounded-md border border-gray-700 focus:border-cyan-400"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeRange === "custom" && (
            <div className="flex items-center gap-2 text-sm">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange((r) => ({ ...r, start: e.target.value }))
                }
                className="bg-gray-800 text-gray-200 px-2 py-1 rounded-md border border-gray-700"
              />
              <span>to</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange((r) => ({ ...r, end: e.target.value }))
                }
                className="bg-gray-800 text-gray-200 px-2 py-1 rounded-md border border-gray-700"
              />
            </div>
          )}
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#0b0e20] p-6 rounded-2xl text-center border border-cyan-500/20 shadow-md hover:shadow-cyan-500/30 transition-all">
            <h3 className="text-gray-400 text-sm">Total Spent</h3>
            <p className="text-2xl font-bold text-cyan-400 mt-2">
              ₹{summary.total.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#0b0e20] p-6 rounded-2xl text-center border border-cyan-500/20 shadow-md hover:shadow-cyan-500/30 transition-all">
            <h3 className="text-gray-400 text-sm">Top Category</h3>
            <p className="text-2xl font-bold text-cyan-400 mt-2">
              {topCategory}
            </p>
          </div>
          <div className="bg-[#0b0e20] p-6 rounded-2xl text-center border border-cyan-500/20 shadow-md hover:shadow-cyan-500/30 transition-all">
            <h3 className="text-gray-400 text-sm">Avg per Day</h3>
            <p className="text-2xl font-bold text-cyan-400 mt-2">₹{avgPerDay}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Monthly Spending */}
          <div className="bg-[#0b0e20] p-6 rounded-2xl border border-cyan-500/20 shadow-md hover:shadow-cyan-500/10 transition-all">
            <h3 className="text-gray-300 text-lg font-semibold mb-3">
              Monthly Spending
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(6,182,212,0.1)" }}
                />
                <Bar
                  dataKey="total"
                  fill="#06b6d4"
                  radius={[8, 8, 0, 0]}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Spending by Category */}
          <div className="bg-[#0b0e20] p-6 rounded-2xl border border-cyan-500/20 shadow-md hover:shadow-cyan-500/10 transition-all">
            <h3 className="text-gray-300 text-lg font-semibold mb-3">
              Spending by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 💡 FinVision AI Spending Forecast */}
        <div className="mt-10 bg-gradient-to-br from-[#0b0e20] to-[#10142d] border border-cyan-500/20 rounded-2xl p-6 shadow-md hover:shadow-cyan-500/20 transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-cyan-400">
                FinVision AI Spending Forecast
              </h3>
              <button
                onClick={loadForecast}
                disabled={aiLoading}
                className="bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-semibold px-4 py-2 rounded-md transition-all hover:scale-105"
              >
                {aiLoading ? "Analyzing..." : "Recalculate"}
              </button>
            </div>

            {aiLoading ? (
              <p className="text-gray-400 text-sm italic animate-pulse">
                FinVision AI is analyzing your financial data...
              </p>
            ) : forecast ? (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {forecast}
              </p>
            ) : (
              <p className="text-gray-400 text-sm italic">
                No forecast available. Click "Recalculate" to generate AI
                insights.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
