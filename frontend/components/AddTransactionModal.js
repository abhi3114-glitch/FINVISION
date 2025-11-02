import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { API } from "../lib/api";

export default function AddTransactionModal({ onClose, onAdded }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Others");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Food",
    "Bills",
    "Travel",
    "Shopping",
    "Entertainment",
    "Subscriptions",
    "Gadgets",
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

      const res = await API.post("/api/transactions", {
        name,
        amount: parseFloat(amount),
        date,
        category,
      });

      toast.success(`✅ Transaction added (${category})`);
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
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-[#0e1121] text-white p-8 rounded-2xl shadow-lg w-full max-w-sm cursor-default"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl transition-all"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-5 text-center">
            Add Transaction
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Transaction Name */}
            <input
              type="text"
              placeholder="Transaction Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#14182b] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
              required
            />

            {/* Amount */}
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#14182b] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
              required
            />

            {/* Date */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#14182b] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
              required
            />

            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#14182b] rounded-md p-3 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-md py-2 mt-2 transition-all"
            >
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
