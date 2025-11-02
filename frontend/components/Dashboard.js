import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Card from "./Card";
import TrendChart from "./charts/TrendChart";
import DonutChart from "./charts/DonutChart";
import AddTransactionModal from "./AddTransactionModal";
import { motion } from "framer-motion";
import { API } from "../lib/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // 🧠 AI Insight States
  const [aiInsights, setAiInsights] = useState({
    advice: "Analyzing your data...",
    free_cash: 0,
    savings_rate: 0,
  });
  const [aiLoading, setAiLoading] = useState(false);

  // 🗂️ Filter States
  const [category, setCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("this_month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  // Animation variants
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const itemUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // 🔁 Refresh user info
  async function refreshUser() {
    const token = API.getToken();
    if (!token) return;
    try {
      const res = await API.get("/api/user/me");
      if (res && res.email) {
        API.saveSession({ access_token: token, user: res });
        setUser(res);
      }
    } catch {
      toast.error("Session expired. Please log in again.");
      API.logout();
    }
  }

  // 🧮 Utility to get date range based on selection
  function getDateParams() {
    const today = new Date();
    let start = "", end = "";
    if (timeRange === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
    } else if (timeRange === "last_month") {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = lastMonth.toISOString().split("T")[0];
      end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
    } else if (timeRange === "this_year") {
      start = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
      end = new Date(today.getFullYear(), 11, 31).toISOString().split("T")[0];
    } else if (timeRange === "custom") {
      start = customRange.start;
      end = customRange.end;
    }
    return { start, end };
  }

  // 🔄 Load dashboard data with filters
  async function loadData() {
    try {
      setLoading(true);
      const { start, end } = getDateParams();
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (start) params.append("start", start);
      if (end) params.append("end", end);

      const query = params.toString() ? `?${params.toString()}` : "";
      const [sum, tx] = await Promise.all([
        API.get(`/api/summary${query}`),
        API.get(`/api/transactions${query}`),
      ]);
      setSummary(sum);
      setTransactions(tx);
      await loadAiInsights(start, end, category);
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  // 🧠 Load AI Insights with filters
  async function loadAiInsights(start, end, category) {
    try {
      setAiLoading(true);
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (start) params.append("start", start);
      if (end) params.append("end", end);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await API.get(`/api/ai/dashboard_insights${query}`);
      if (res) {
        setAiInsights({
          advice: res.advice || "Spend smart and save wisely 💡",
          free_cash: res.free_cash || 0,
          savings_rate: res.savings_rate || 0,
        });
      }
    } catch {
      toast.error("AI insights unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  }

  // 🧭 Initial load
  useEffect(() => {
    setMounted(true);
    async function init() {
      const storedUser = API.getUser();
      if (storedUser) {
        setUser(storedUser);
        await refreshUser();
        await loadData();
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 🔁 Reload on filter change
  useEffect(() => {
    if (user && mounted) loadData();
  }, [category, timeRange, customRange]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-3xl font-semibold text-cyan-400">
          Welcome to FinVision 💰
        </h1>
        <p className="text-gray-400 text-sm">
          Login with Google to access your personalized AI-powered dashboard.
        </p>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-full transition-all hover:scale-105 shadow-lg"
        >
          Login with Google
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-lg">
        Loading your dashboard...
      </div>
    );
  }

  // ✅ Main Dashboard
  return (
    <div className="flex w-full">
      <Sidebar />

      <main className="ml-72 flex-1 p-10 relative">
        {/* Top Header */}
        <Header
          subtitle="Overview of your spending, goals, and forecasts"
          user={user}
          onLogout={() => {
            API.logout();
            toast.success("Logged out successfully!");
          }}
        />

        {/* 🔍 Filters */}
        <div className="flex items-center gap-4 mb-6">
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

        {/* Dashboard Content */}
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Summary Cards */}
          <motion.div variants={itemUp} className="grid grid-cols-3 gap-6 mb-8">
            <Card title="Total Spent" value={`₹ ${summary?.total?.toLocaleString() || 0}`} />
            <Card title="Transactions" value={transactions.length.toString()} />
            <Card
              title="Free Cash"
              value={
                aiLoading
                  ? "Calculating..."
                  : `₹ ${aiInsights.free_cash.toLocaleString()}`
              }
            />
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-3 gap-6">
            <motion.div variants={itemUp} className="col-span-2 card-glow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Spending Trend</h3>
              </div>
              <TrendChart transactions={transactions} />
            </motion.div>

            <motion.div variants={itemUp} className="card-glow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Category Breakdown</h3>
              </div>
              <DonutChart transactions={transactions} />
            </motion.div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <motion.div variants={itemUp} className="card-glow p-6">
              <h4 className="font-semibold mb-2">Top Expense</h4>
              <div className="text-sm text-gray-300">
                {transactions[0]
                  ? `${transactions[0].name} • ₹${transactions[0].amount}`
                  : "No data"}
              </div>
            </motion.div>

            <motion.div variants={itemUp} className="card-glow p-6">
              <h4 className="font-semibold mb-2">Savings Rate</h4>
              <div className="text-sm text-yellow-400 font-medium">
                {aiLoading
                  ? "Predicting..."
                  : `${aiInsights.savings_rate}% / month`}
              </div>
            </motion.div>

            <motion.div variants={itemUp} className="card-glow p-6">
              <h4 className="font-semibold mb-2">AI Advice</h4>
              <div
                className={`text-sm ${
                  aiLoading ? "text-gray-400 italic" : "text-blue-400"
                }`}
              >
                {aiLoading ? "Thinking..." : aiInsights.advice}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ➕ Add Transaction */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-10 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-full w-14 h-14 text-3xl shadow-lg transition-all hover:scale-110"
        >
          +
        </button>

        {showModal && (
          <AddTransactionModal
            onClose={() => setShowModal(false)}
            onAdded={() => {
              setShowModal(false);
              loadData();
            }}
          />
        )}
      </main>
    </div>
  );
}
