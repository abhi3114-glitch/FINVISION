import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { API } from "../lib/api";

export default function AddTransactionModal({ onClose, onAdded }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Others");
  const [type, setType] = useState("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!name.trim() || !amount || parseFloat(amount) <= 0) {
        toast.error("Please enter valid name and amount");
        return;
      }

      await API.post("/api/transactions", {
        name,
        amount: parseFloat(amount),
        date,
        category,
        type,
      });

      toast.success(
        type === "income"
          ? `💰 Income added (${category})`
          : `💸 Expense added (${category})`
      );

      onAdded?.();
      onClose();
    } catch (err) {
      console.error("Add transaction failed:", err);
      toast.error("❌ Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-[#0e1121] text-white p-6 rounded-2xl shadow-lg w-full max-w-sm cursor-default max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button - Mobile Optimized */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-all"
            aria-label="Close"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-6 text-center">
            Add Transaction
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Transaction Name - Mobile Optimized */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input
                type="text"
                placeholder="Enter transaction name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#14182b] rounded-lg p-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                required
                autoFocus
              />
            </div>

            {/* Amount - Mobile Optimized */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#14182b] rounded-lg p-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Type Selector - Mobile Optimized */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Type</label>
              <div className="flex justify-between bg-[#14182b] rounded-lg p-1">
                <label className="flex items-center gap-2 flex-1 justify-center py-3 rounded-lg transition-all">
                  <input
                    type="radio"
                    value="expense"
                    checked={type === "expense"}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only" // Hide default radio, we'll style the label
                  />
                  <span className={`text-sm font-medium px-4 py-2 rounded-md transition-all ${
                    type === "expense" 
                      ? "bg-red-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}>
                    Expense
                  </span>
                </label>
                <label className="flex items-center gap-2 flex-1 justify-center py-3 rounded-lg transition-all">
                  <input
                    type="radio"
                    value="income"
                    checked={type === "income"}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only"
                  />
                  <span className={`text-sm font-medium px-4 py-2 rounded-md transition-all ${
                    type === "income" 
                      ? "bg-green-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}>
                    Income
                  </span>
                </label>
              </div>
            </div>

            {/* Date - Mobile Optimized */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#14182b] rounded-lg p-4 text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                required
              />
            </div>

            {/* Category Dropdown - Mobile Optimized */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#14182b] rounded-lg p-4 text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full appearance-none"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button - Mobile Optimized */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${
                type === "income"
                  ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
                  : "bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700"
              } text-black font-semibold rounded-lg py-4 px-6 mt-2 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </div>
              ) : type === "income" ? (
                "Add Income"
              ) : (
                "Add Expense"
              )}
            </button>
          </form>

          {/* 📱 Mobile Keyboard Helper */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Tap outside to close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}