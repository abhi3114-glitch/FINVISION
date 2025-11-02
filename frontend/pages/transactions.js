import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api";
import toast from "react-hot-toast";
import AddTransactionModal from "../components/AddTransactionModal";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("All");
  const [range, setRange] = useState("This Month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [mounted, setMounted] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
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

  const categories = [
    "All",
    "Food",
    "Bills",
    "Travel",
    "Shopping",
    "Entertainment",
    "Subscriptions",
    "Gadgets",
    "Salary",
    "Others",
  ];

  const ranges = ["This Month", "Last Month", "This Year", "Custom Range"];

  // Safe amount formatter
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // 📅 Calculate start/end date for selected range
  function getDateRange() {
    const today = new Date();
    let start, end;

    if (range === "This Month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (range === "Last Month") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (range === "This Year") {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (range === "Custom Range" && customRange.start && customRange.end) {
      start = new Date(customRange.start);
      end = new Date(customRange.end);
    } else {
      return {};
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }

  // 🔄 Load transactions with filters - SAFE VERSION
  async function loadTransactions() {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const params = {
        ...(filter !== "All" ? { category: filter } : {}),
        ...(start ? { start, end } : {}),
      };
      const data = await API.get("/api/transactions", params);
      
      // Safe data processing
      const safeData = Array.isArray(data) ? data : [];
      setTransactions(safeData);
    } catch (err) {
      console.error("Transaction load error:", err);
      toast.error("Failed to fetch transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  // 🗑️ Confirm delete modal
  async function confirmDelete() {
    try {
      await API.delete(`/api/transactions/${deleteId}`);
      setTransactions((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
      toast.success("🗑️ Transaction deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete transaction");
    }
  }

  // 👤 Initialize user + data
  async function initUserAndData() {
    const storedUser = API.getUser();
    if (storedUser) {
      setUser(storedUser);
      await loadTransactions();
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    initUserAndData();
  }, []);

  useEffect(() => {
    if (user) loadTransactions();
  }, [filter, range, customRange]);

  if (!mounted) return null;

  // 🚫 Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 px-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-cyan-400">Please Login First 💡</h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg text-base"
        >
          Login with Google
        </button>
      </div>
    );
  }

  // ✅ Main Layout
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
        fixed lg:static inset-y-0 left-0 z-[1001]
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
          subtitle="View and manage all your expenses and income by time and category"
          user={user}
          onLogout={() => {
            API.logout();
            toast.success("Logged out successfully!");
          }}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Rest of your transactions content */}
        <main className="p-4 lg:p-10 relative min-h-screen">
          {/* 📱 Mobile-optimized Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-4 py-3 sm:py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full sm:w-auto"
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-4 py-3 sm:py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full sm:w-auto"
              >
                {ranges.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>

              {range === "Custom Range" && (
                <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                    className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none w-full sm:w-auto"
                  />
                  <span className="hidden sm:inline text-gray-400">to</span>
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                    className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none w-full sm:w-auto"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-6 rounded-full shadow-lg transition-all hover:scale-105 w-full sm:w-auto text-base"
            >
              + Add Transaction
            </button>
          </div>

          {/* 📱 Mobile-optimized Transactions List */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading transactions...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400 text-lg mb-2">No transactions found</p>
              <p className="text-gray-500 text-sm">Try changing your filters or add a new transaction</p>
            </div>
          ) : (
            <>
              {/* 📱 Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {transactions.map((t, i) => (
                  <motion.div
                    key={t.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0e1121] border border-cyan-400/10 rounded-xl p-4 hover:border-cyan-400/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm truncate">{t.name || 'Unnamed'}</h3>
                        <p className="text-gray-400 text-xs mt-1">
                          {t.date ? new Date(t.date).toLocaleDateString() : 'Invalid Date'}
                        </p>
                      </div>
                      <div className={`text-right font-semibold ${
                        t.type === "income" ? "text-green-400" : "text-red-400"
                      }`}>
                        ₹{formatAmount(t.amount)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            t.category === "Food"
                              ? "bg-green-500/20 text-green-400"
                              : t.category === "Bills"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : t.category === "Travel"
                              ? "bg-blue-500/20 text-blue-400"
                              : t.category === "Shopping"
                              ? "bg-purple-500/20 text-purple-400"
                              : t.category === "Entertainment"
                              ? "bg-pink-500/20 text-pink-400"
                              : "bg-gray-600/20 text-gray-300"
                          }`}
                        >
                          {t.category || "Others"}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            t.type === "income"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {t.type === "income" ? "Income" : "Expense"}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="text-red-500 hover:text-red-700 transition p-1"
                        aria-label="Delete transaction"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 💻 Desktop Table View */}
              <motion.div
                className="hidden lg:block card-glow p-6 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-cyan-400/10">
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2">Name</th>
                        <th className="pb-3 px-2">Category</th>
                        <th className="pb-3 px-2">Type</th>
                        <th className="pb-3 px-2 text-right">Amount (₹)</th>
                        <th className="pb-3 px-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr
                          key={t.id || i}
                          className="border-b border-gray-800 hover:bg-[#101426] transition-all"
                        >
                          <td className="py-3 px-2 text-gray-300 text-sm">
                            {t.date ? new Date(t.date).toLocaleDateString() : 'Invalid Date'}
                          </td>
                          <td className="text-gray-200 text-sm">{t.name || 'Unnamed'}</td>
                          <td className="px-2">
                            <span
                              className={`text-xs font-medium px-3 py-1 rounded-full ${
                                t.category === "Food"
                                  ? "bg-green-500/20 text-green-400"
                                  : t.category === "Bills"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : t.category === "Travel"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : t.category === "Shopping"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : t.category === "Entertainment"
                                  ? "bg-pink-500/20 text-pink-400"
                                  : "bg-gray-600/20 text-gray-300"
                              }`}
                            >
                              {t.category || "Others"}
                            </span>
                          </td>
                          <td className="px-2">
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-medium ${
                                t.type === "income"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {t.type === "income" ? "Income" : "Expense"}
                            </span>
                          </td>
                          <td
                            className={`text-right font-semibold px-2 text-sm ${
                              t.type === "income" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            ₹{formatAmount(t.amount)}
                          </td>
                          <td className="text-center px-2">
                            <button
                              onClick={() => setDeleteId(t.id)}
                              className="text-red-500 hover:text-red-700 transition p-1"
                              aria-label="Delete transaction"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* ➕ Modal */}
          {showModal && (
            <AddTransactionModal
              onClose={() => setShowModal(false)}
              onAdded={() => {
                setShowModal(false);
                loadTransactions();
              }}
            />
          )}

          {/* 🗑️ Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-[#0e1121] p-6 rounded-2xl text-white shadow-lg w-full max-w-sm"
                >
                  <h2 className="text-xl font-semibold text-center mb-3">
                    Confirm Deletion
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    Are you sure you want to delete this transaction? This action cannot be undone.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setDeleteId(null)}
                      className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}