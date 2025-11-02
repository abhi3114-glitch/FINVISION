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
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_balance: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [forecast, setForecast] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Will be set based on screen size

  // ✅ Set initial sidebar state based on screen size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let wasDesktop = window.innerWidth >= 1024;
      setIsSidebarOpen(wasDesktop);
      
      const handleResize = () => {
        const isDesktop = window.innerWidth >= 1024;
        // Only auto-update when crossing the breakpoint
        if (wasDesktop !== isDesktop) {
          setIsSidebarOpen(isDesktop);
          wasDesktop = isDesktop;
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

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

  // Safe number formatter
  const safeFormatNumber = (num) => {
    const number = parseFloat(num);
    return isNaN(number) ? '0.00' : number.toFixed(2);
  };

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
      setTransactions(Array.isArray(tx) ? tx : []);
      setSummary(sum || { total_income: 0, total_expense: 0, net_balance: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
      setTransactions([]);
      setSummary({ total_income: 0, total_expense: 0, net_balance: 0 });
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
      <div className="flex h-screen items-center justify-center bg-[#070919] px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Analytics...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 px-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-cyan-400">
          Please Login First 💡
        </h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg text-base"
        >
          Login with Google
        </button>
      </div>
    );

  // 📊 Prepare chart data - SHOW ONLY EXPENSES
  const monthlyData = transactions.reduce((acc, t) => {
    // ✅ Only include expense transactions
    if (t.type === "expense") {
      const month = new Date(t.date).toLocaleString("default", { month: "short" });
      const amount = parseFloat(t.amount) || 0;
      acc[month] = (acc[month] || 0) + amount;
    }
    return acc;
  }, {});
  const barData = Object.keys(monthlyData).map((m) => ({
    month: m,
    total: monthlyData[m],
  }));

  const categoryData = transactions.reduce((acc, t) => {
    // ✅ Only include expense transactions
    if (t.type === "expense") {
      const amount = parseFloat(t.amount) || 0;
      const categoryName = t.category || 'Other';
      acc[categoryName] = (acc[categoryName] || 0) + amount;
    }
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

  // Safe average calculation - USE EXPENSE DATA
  const totalExpense = parseFloat(summary.total_expense) || 0;
  const avgPerDay = totalExpense > 0 ? (totalExpense / 30) : 0;

  const tooltipStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(6,182,212,0.5)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
    padding: "6px 8px",
  };

  return (
    <div className="flex min-h-screen"> {/* ✅ Fixed: Simple flex container */}
      {/* ✅ Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* ✅ Sidebar with mobile and desktop responsiveness */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-all duration-300 ease-in-out
        ${isSidebarOpen 
          ? 'translate-x-0 lg:translate-x-0 lg:w-72' 
          : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        }
      `}>
        <Sidebar 
          onMobileClose={() => setIsSidebarOpen(false)}
          isOpen={isSidebarOpen}
        />
      </div>

      {/* ✅ Main Content Area */}
      <div className="flex-1">
        <Header
          subtitle="Visualize your spending patterns and insights"
          user={user}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Rest of your analytics content */}
        <main className="p-4 lg:p-10 relative min-h-screen">
          {/* 📱 Mobile-optimized Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-800 text-gray-200 px-3 py-3 sm:py-2 rounded-md border border-gray-700 focus:border-cyan-400 text-sm w-full sm:w-auto"
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
                className="bg-gray-800 text-gray-200 px-3 py-3 sm:py-2 rounded-md border border-gray-700 focus:border-cyan-400 text-sm w-full sm:w-auto"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {timeRange === "custom" && (
                <div className="flex flex-col sm:flex-row items-center gap-2 text-sm w-full sm:w-auto">
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) =>
                      setCustomRange((r) => ({ ...r, start: e.target.value }))
                    }
                    className="bg-gray-800 text-gray-200 px-2 py-2 rounded-md border border-gray-700 w-full sm:w-auto text-sm"
                  />
                  <span className="hidden sm:inline text-gray-400">to</span>
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) =>
                      setCustomRange((r) => ({ ...r, end: e.target.value }))
                    }
                    className="bg-gray-800 text-gray-200 px-2 py-2 rounded-md border border-gray-700 w-full sm:w-auto text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 📱 Mobile-optimized Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
            <div className="bg-[#0b0e20] p-4 lg:p-6 rounded-2xl text-center border border-cyan-500/20 shadow-md hover:shadow-cyan-500/30 transition-all">
              <h3 className="text-gray-400 text-xs lg:text-sm">Total Spent</h3>
              <p className="text-xl lg:text-2xl font-bold text-cyan-400 mt-1 lg:mt-2">
                ₹{safeFormatNumber(summary.total_expense || 0)}
              </p>
            </div>
            <div className="bg-[#0b0e20] p-4 lg:p-6 rounded-2xl text-center border border-cyan-500/20 shadow-md hover:shadow-cyan-500/30 transition-all">
              <h3 className="text-gray-400 text-xs lg:text-sm">Top Category</h3>
              <p className="text-xl lg:text-2xl font-bold text-cyan-400 mt-1 lg:mt-2 truncate px-2">
                {topCategory}
              </p>
            </div>
            <div className="bg-[#0b0e20] p-4 lg:p-6 rounded-2xl text-center border border-cyan-500/20 shadow-md hover:shadow-cyan-500/30 transition-all">
              <h3 className="text-gray-400 text-xs lg:text-sm">Avg per Day</h3>
              <p className="text-xl lg:text-2xl font-bold text-cyan-400 mt-1 lg:mt-2">
                ₹{safeFormatNumber(avgPerDay)}
              </p>
            </div>
          </div>

          {/* 📱 Mobile-optimized Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Monthly Spending */}
            <div className="bg-[#0b0e20] p-4 lg:p-6 rounded-2xl border border-cyan-500/20 shadow-md hover:shadow-cyan-500/10 transition-all">
              <h3 className="text-gray-300 text-base lg:text-lg font-semibold mb-3">
                Monthly Spending
              </h3>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tick={{ fill: '#94a3b8' }}
                      width={40}
                      tickFormatter={(value) => {
                        if (value >= 1000) return `₹${(value/1000).toFixed(0)}k`;
                        return `₹${value}`;
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "rgba(6,182,212,0.1)" }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spending by Category */}
            <div className="bg-[#0b0e20] p-4 lg:p-6 rounded-2xl border border-cyan-500/20 shadow-md hover:shadow-cyan-500/10 transition-all">
              <h3 className="text-gray-300 text-base lg:text-lg font-semibold mb-3">
                Spending by Category
              </h3>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend 
                      wrapperStyle={{
                        fontSize: '12px',
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 📱 Mobile-optimized AI Forecast */}
          <div className="mt-8 lg:mt-10 bg-gradient-to-br from-[#0b0e20] to-[#10142d] border border-cyan-500/20 rounded-2xl p-4 lg:p-6 shadow-md hover:shadow-cyan-500/20 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-2xl lg:blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-cyan-400">
                  FinVision AI Spending Forecast
                </h3>
                <button
                  onClick={loadForecast}
                  disabled={aiLoading}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-semibold px-4 py-2 rounded-md transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                >
                  {aiLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </div>
                  ) : (
                    "Recalculate"
                  )}
                </button>
              </div>

              {aiLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  FinVision AI is analyzing your financial data...
                </div>
              ) : forecast ? (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {forecast}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No forecast available. Click "Recalculate" to generate AI insights.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}