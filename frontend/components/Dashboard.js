// dashboard.js
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
  // ------- Core UI state -------
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    free_cash: 0,
    saving_percent: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // ------- AI insight state -------
  const [aiInsights, setAiInsights] = useState({
    advice: "Analyzing your finances...",
    free_cash: 0,
    savings_rate: 0,
  });
  const [aiLoading, setAiLoading] = useState(false);

  // ------- Filters -------
  const [category, setCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("this_month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  // ------- Animations -------
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const itemUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

  // ------- Helpers -------
  function getDateParams() {
    const today = new Date();
    let start = "", end = "";
    if (timeRange === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
    } else if (timeRange === "last_month") {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = lastMonthStart.toISOString().split("T")[0];
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

  // refreshUser: checks token & fetches latest user info
  async function refreshUser() {
    const token = API.getToken();
    if (!token) return;
    try {
      const res = await API.get("/api/user/me");
      if (res && res.email) {
        API.saveSession({ access_token: token, user: res });
        setUser(res);
      }
    } catch (err) {
      console.warn("Session refresh failed:", err);
      toast.error("Session expired. Please log in again.");
      API.logout();
      setUser(null);
    }
  }

  // Load AI insights (filtered)
  async function loadAiInsights(start, end, categoryParam) {
    try {
      setAiLoading(true);
      const params = new URLSearchParams();
      if (categoryParam && categoryParam !== "All") params.append("category", categoryParam);
      if (start) params.append("start", start);
      if (end) params.append("end", end);
      const query = params.toString() ? `?${params.toString()}` : "";

      const res = await API.get(`/api/ai/dashboard_insights${query}`);
      if (res) {
        setAiInsights({
          advice: res.advice || "Spend smart, save better 💡",
          free_cash: res.free_cash ?? 0,
          savings_rate: res.savings_rate ?? 0,
        });
      }
    } catch (err) {
      console.error("AI insights error:", err);
      toast.error("AI insights unavailable");
    } finally {
      setAiLoading(false);
    }
  }

  // Add this function to test your API
  const testTransactionsAPI = async () => {
    try {
      console.log("🧪 Testing transactions API...");
      const testData = await API.get("/api/transactions");
      console.log("✅ Transactions API test:", testData);
      
      // Check if transactions have the correct structure
      if (Array.isArray(testData)) {
        testData.forEach((t, i) => {
          console.log(`Transaction ${i}:`, {
            name: t.name,
            amount: t.amount,
            type: t.type,
            category: t.category
          });
        });
      }
    } catch (error) {
      console.error("❌ Transactions API test failed:", error);
    }
  };

  // Load summary & transactions - MANUAL CALCULATION (RELIABLE)
  async function loadData() {
    try {
      setLoading(true);
      const { start, end } = getDateParams();
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (start) params.append("start", start);
      if (end) params.append("end", end);
      const query = params.toString() ? `?${params.toString()}` : "";

      console.log("🔄 Loading transactions with query:", query);
      
      // Load transactions from API
      const txRes = await API.get(`/api/transactions${query}`);
      const safeTransactions = Array.isArray(txRes) ? txRes : [];
      console.log("✅ Transactions loaded:", safeTransactions);

      // MANUAL CALCULATION - This will always work
      const calculatedSummary = safeTransactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        const transactionType = transaction.type || 'expense';
        
        console.log(`📊 Processing: ${transaction.name} - ${transactionType} - ₹${amount}`);
        
        if (transactionType === 'income') {
          acc.total_income += amount;
        } else {
          acc.total_expense += amount;
        }
        return acc;
      }, { total_income: 0, total_expense: 0 });

      // Calculate free cash and savings percentage
      calculatedSummary.free_cash = calculatedSummary.total_income - calculatedSummary.total_expense;
      calculatedSummary.saving_percent = calculatedSummary.total_income > 0 
        ? Math.round((calculatedSummary.free_cash / calculatedSummary.total_income) * 100) 
        : 0;

      console.log("💰 FINAL CALCULATED SUMMARY:", {
        income: calculatedSummary.total_income,
        expense: calculatedSummary.total_expense,
        free_cash: calculatedSummary.free_cash,
        saving_percent: calculatedSummary.saving_percent
      });
      
      // Set the calculated summary
      setSummary(calculatedSummary);
      setTransactions(safeTransactions);
      
      // Load AI insights
      await loadAiInsights(start, end, category);
      
    } catch (err) {
      console.error("❌ Dashboard load failed:", err);
      toast.error("Failed to load dashboard data");
      
      // Set empty state on error
      setSummary({
        total_income: 0,
        total_expense: 0,
        free_cash: 0,
        saving_percent: 0,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial mount: set mounted, load session/user and data
  useEffect(() => {
    setMounted(true);
    async function init() {
      const storedUser = API.getUser();
      if (storedUser) {
        setUser(storedUser);
        await refreshUser();
        await testTransactionsAPI(); // Test the API
        await loadData();
      } else {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload when filters change
  useEffect(() => {
    if (user && mounted) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, timeRange, customRange]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-3xl font-semibold text-cyan-400">Welcome to FinVision 💰</h1>
        <p className="text-gray-400 text-sm">Login to view your AI-powered finance dashboard.</p>
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

  // compute top expense (safely)
  const topExpense = transactions
    .filter((t) => (t.type ?? "expense") === "expense")
    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))[0];

  // ---------- Render ----------
  return (
    <div className="flex w-full">
      <Sidebar />

      <main className="ml-72 flex-1 p-10 relative">
        <Header
          subtitle="AI-driven overview of your spending, income, and savings"
          user={user}
          onLogout={() => {
            API.logout();
            toast.success("Logged out successfully!");
            setUser(null);
          }}
        />

        {/* Filters */}
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
            <option>Salary</option>
            <option>Others</option>
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
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                className="bg-gray-800 text-gray-200 px-2 py-1 rounded-md border border-gray-700"
              />
              <span>to</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                className="bg-gray-800 text-gray-200 px-2 py-1 rounded-md border border-gray-700"
              />
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-4 gap-6 mb-8">
          <Card title="Total Income" value={`₹ ${Number(summary.total_income || 0).toLocaleString()}`} color="text-green-400" />
          <Card title="Total Expense" value={`₹ ${Number(summary.total_expense || 0).toLocaleString()}`} color="text-red-400" />
          <Card title="Free Cash" value={`₹ ${Number(summary.free_cash || 0).toLocaleString()}`} color="text-blue-400" />
          <Card title="Saving Rate" value={`${Number(summary.saving_percent || 0)}%`} color="text-yellow-400" />
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-6">
          <motion.div variants={itemUp} className="col-span-2 card-glow p-6">
            <h3 className="text-lg font-semibold mb-4">Spending Trend</h3>
            <TrendChart transactions={transactions} />
          </motion.div>

          <motion.div variants={itemUp} className="card-glow p-6">
            <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
            <DonutChart transactions={transactions} />
          </motion.div>
        </div>

        {/* Insights (AI + Top Expense) */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-6 mt-8">
          <motion.div variants={itemUp} className="card-glow p-6">
            <h4 className="font-semibold mb-2">AI Financial Advice</h4>
            <p className={`text-sm ${aiLoading ? "text-gray-400 italic" : "text-cyan-400"}`}>
              {aiLoading ? "Analyzing..." : aiInsights.advice}
            </p>
          </motion.div>

          <motion.div variants={itemUp} className="card-glow p-6">
            <h4 className="font-semibold mb-2">AI Free Cash Prediction</h4>
            <p className="text-blue-400 text-lg font-semibold">
              {aiLoading ? "..." : `₹ ${Number(aiInsights.free_cash || 0).toLocaleString()}`}
            </p>
          </motion.div>

          <motion.div variants={itemUp} className="card-glow p-6">
            <h4 className="font-semibold mb-2">AI Saving Efficiency</h4>
            <p className="text-yellow-400 text-lg font-semibold">
              {aiLoading ? "..." : `${Number(aiInsights.savings_rate || 0)}%`}
            </p>
          </motion.div>
        </motion.div>

        {/* Additional Insights row */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <motion.div variants={itemUp} className="card-glow p-6">
            <h4 className="font-semibold mb-2">Top Expense</h4>
            <div className="text-sm text-gray-300">
              {topExpense ? `${topExpense.name} • ₹${Number(topExpense.amount || 0).toLocaleString()}` : "No data"}
            </div>
          </motion.div>

          <motion.div variants={itemUp} className="card-glow p-6">
            <h4 className="font-semibold mb-2">Transactions</h4>
            <div className="text-sm text-gray-300">{transactions.length} transactions</div>
          </motion.div>

          <motion.div variants={itemUp} className="card-glow p-6">
            <h4 className="font-semibold mb-2">Quick Tip</h4>
            <div className="text-sm text-gray-300">
              {aiLoading ? "Loading tip..." : (aiInsights.advice || "Track small spends to save big.")}
            </div>
          </motion.div>
        </div>

        {/* Add Transaction FAB */}
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