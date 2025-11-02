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
  const [deleteId, setDeleteId] = useState(null); // ✅ For delete confirmation modal

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

  // 🔄 Load transactions with filters
  async function loadTransactions() {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const params = {
        ...(filter !== "All" ? { category: filter } : {}),
        ...(start ? { start, end } : {}),
      };
      const data = await API.get("/api/transactions", params);
      setTransactions(data);
    } catch (err) {
      console.error("Transaction load error:", err);
      toast.error("Failed to fetch transactions");
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
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-6">
        <h1 className="text-3xl font-semibold text-cyan-400">Please Login First 💡</h1>
        <button
          onClick={() => API.loginWithGoogle()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-6 rounded-full transition-all hover:scale-105 shadow-lg"
        >
          Login with Google
        </button>
      </div>
    );
  }

  // ✅ Main Layout
  return (
    <div className="flex w-full">
      <Sidebar />

      <main className="ml-72 flex-1 p-10 relative">
        <Header
          subtitle="View and manage all your expenses and income by time and category"
          user={user}
          onLogout={() => {
            API.logout();
            toast.success("Logged out successfully!");
          }}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              {ranges.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>

            {range === "Custom Range" && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none"
                />
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="bg-[#0b0e20] border border-cyan-400/30 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-5 rounded-full shadow-lg transition-all hover:scale-105"
          >
            + Add Transaction
          </button>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-gray-400 text-center mt-10">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-400 text-center mt-10">No transactions found.</div>
        ) : (
          <motion.div
            className="card-glow p-6 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-cyan-400/10">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Amount (₹)</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr
                    key={t.id || i}
                    className="border-b border-gray-800 hover:bg-[#101426] transition-all"
                  >
                    <td className="py-3 text-gray-300">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="text-gray-200">{t.name}</td>
                    <td>
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
                    <td>
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
                      className={`text-right font-semibold ${
                        t.type === "income" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      ₹{parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="text-red-500 hover:text-red-700 transition text-lg"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
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
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
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
                <p className="text-gray-400 text-center mb-6">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold transition"
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
  );
}
