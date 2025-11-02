import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { API } from "../lib/api";
import toast from "react-hot-toast";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target_amount: "",
    duration_months: "",
  });

  // AI Tips Modal
  const [aiTips, setAiTips] = useState([]);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [tipsCache, setTipsCache] = useState({});

  // 🔄 Fetch all goals
  async function loadGoals() {
    try {
      setLoading(true);
      const data = await API.get("/api/goals");
      setGoals(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  }

  // ➕ Add new goal
  async function handleAddGoal() {
    const name = newGoal.name.trim();
    const target = parseFloat(newGoal.target_amount);
    const months = parseInt(newGoal.duration_months);

    if (!name || isNaN(target) || isNaN(months)) {
      toast.error("Please fill all fields correctly!");
      return;
    }

    const payload = { name, target_amount: target, duration_months: months };

    try {
      await API.post("/api/goals", payload);
      toast.success("Goal added successfully!");
      setShowModal(false);
      setNewGoal({ name: "", target_amount: "", duration_months: "" });
      loadGoals();
    } catch (err) {
      console.error("Add Goal Error:", err);
      toast.error("Failed to add goal");
    }
  }

  // 💰 Increment goal progress
  async function handleUpdateProgress() {
    if (!updateAmount || !selectedGoal) {
      toast.error("Please enter saved amount");
      return;
    }

    try {
      await API.patch(`/api/goals/${selectedGoal.id}`, {
        saved_amount: parseFloat(updateAmount),
      });
      toast.success(`Added ₹${updateAmount} to your savings!`);
      setShowUpdateModal(false);
      setUpdateAmount("");
      loadGoals();
    } catch (err) {
      console.error("Update Goal Error:", err);
      toast.error("Failed to update progress");
    }
  }

  // 🗑️ Delete a goal
  async function handleDeleteGoalConfirm() {
    try {
      await API.delete(`/api/goals/${selectedGoal.id}`);
      toast.success(`Deleted goal "${selectedGoal.name}"`);
      setShowDeleteModal(false);
      setSelectedGoal(null);
      loadGoals();
    } catch (err) {
      console.error("Delete Goal Error:", err);
      toast.error("Failed to delete goal");
    }
  }

  // 🧠 Fetch AI Tips
  async function handleGetAiTips(goal) {
    if (tipsCache[goal.id]) {
      setAiTips(tipsCache[goal.id]);
      setSelectedGoal(goal);
      setShowTipsModal(true);
      return;
    }

    try {
      setAiLoading(true);
      setSelectedGoal(goal);
      setShowTipsModal(true);

      const res = await API.post("/api/ai/goal_tips", {
        goal_name: goal.name,
        target_amount: goal.target_amount,
      });

      let tipsText = res?.reply || "";
      const tipsArray = tipsText
        .split(/\n|\d+\.\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 3);

      setAiTips(tipsArray);
      setTipsCache((prev) => ({ ...prev, [goal.id]: tipsArray }));
    } catch (err) {
      console.error("AI Tips Error:", err);
      toast.error("Failed to fetch AI tips");
    } finally {
      setAiLoading(false);
    }
  }

  // 🧠 Initialize
  useEffect(() => {
    setMounted(true);
    const storedUser = API.getUser();
    if (storedUser) {
      setUser(storedUser);
      loadGoals();
    } else {
      setLoading(false);
    }
  }, []);

  if (!mounted) return null;

  if (!user) {
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
  }

  return (
    <div className="flex w-full">
      <Sidebar />
      <main className="ml-72 flex-1 p-10 relative">
        <Header
          subtitle="Track your savings and financial goals"
          user={user}
          onLogout={() => {
            API.logout();
            toast.success("Logged out successfully!");
          }}
        />

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-semibold">Your Goals</h3>
          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-5 rounded-full shadow-lg transition-all hover:scale-105"
          >
            + Add Goal
          </button>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="text-gray-400 text-center mt-10">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="text-gray-400 text-center mt-10">
            No goals found. Add your first goal!
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {goals.map((goal, i) => {
              const progress =
                Math.min(
                  (goal.saved_amount / goal.target_amount) * 100 || 0,
                  100
                ).toFixed(1) || 0;

              return (
                <motion.div
                  key={goal.id || i}
                  className="bg-gradient-to-br from-[#0b0e20] to-[#10142d] border border-cyan-500/20 rounded-2xl p-6 shadow-md hover:shadow-cyan-500/20 transition-all relative"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg text-cyan-400">
                      {goal.name}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {goal.duration_months} mo
                    </span>
                  </div>

                  <div className="w-full bg-gray-800 rounded-full h-2 mt-3 mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-gray-400">
                    <div>
                      Saved:{" "}
                      <span className="text-cyan-400 font-medium">
                        ₹{goal.saved_amount?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      Target:{" "}
                      <span className="text-purple-400 font-medium">
                        ₹{goal.target_amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-300">
                    {progress < 100
                      ? `💡 You’re ${(
                          100 - progress
                        ).toFixed()}% away from completing your goal.`
                      : "🎉 Goal achieved! Keep saving smartly!"}
                  </div>

                  {/* Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowUpdateModal(true);
                      }}
                      className="text-xs bg-cyan-600 hover:bg-cyan-500 text-black px-3 py-1 rounded-full shadow-md transition-all"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => handleGetAiTips(goal)}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-full shadow-md transition-all"
                    >
                      AI Tips
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowDeleteModal(true);
                      }}
                      className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-full shadow-md transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ✅ ADD GOAL MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div
              className="bg-[#0b0e20] border border-cyan-400/30 rounded-2xl p-8 w-[90%] max-w-md"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-center text-cyan-400">
                Add New Goal
              </h3>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Goal Name (e.g. Buy a Laptop)"
                  value={newGoal.name}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, name: e.target.value })
                  }
                  className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <input
                  type="number"
                  placeholder="Target Amount (₹)"
                  value={newGoal.target_amount}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, target_amount: e.target.value })
                  }
                  className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <input
                  type="number"
                  placeholder="Duration (months)"
                  value={newGoal.duration_months}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, duration_months: e.target.value })
                  }
                  className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-5 rounded-full shadow-lg transition-all"
                >
                  Save Goal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ✅ UPDATE PROGRESS MODAL */}
        {showUpdateModal && selectedGoal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div
              className="bg-[#0b0e20] border border-cyan-400/30 rounded-2xl p-8 w-[90%] max-w-md"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-center text-cyan-400">
                Add to {selectedGoal.name}
              </h3>
              <input
                type="number"
                placeholder="Enter amount to add (₹)"
                value={updateAmount}
                onChange={(e) => setUpdateAmount(e.target.value)}
                className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-2 w-full text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProgress}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-5 rounded-full shadow-lg transition-all"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ✅ DELETE CONFIRMATION MODAL */}
        {showDeleteModal && selectedGoal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div
              className="bg-[#0b0e20] border border-red-400/30 rounded-2xl p-8 w-[90%] max-w-md text-gray-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-xl font-semibold text-center text-red-400 mb-4">
                Delete Goal?
              </h3>
              <p className="text-center text-gray-400 text-sm mb-6">
                Are you sure you want to delete{" "}
                <span className="text-red-300 font-semibold">
                  "{selectedGoal.name}"
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-2 rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGoalConfirm}
                  className="bg-red-500 hover:bg-red-600 text-black font-semibold px-6 py-2 rounded-full shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ✅ AI TIPS MODAL */}
        {showTipsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div
              className="bg-[#0b0e20] border border-purple-400/30 rounded-2xl p-8 w-[90%] max-w-lg text-gray-200"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-semibold text-center text-purple-400 mb-4">
                AI Tips for {selectedGoal?.name}
              </h3>

              {aiLoading ? (
                <p className="text-center text-gray-400 italic animate-pulse">
                  Thinking like a finance guru...
                </p>
              ) : aiTips?.length > 0 ? (
                <ul className="list-disc space-y-2 pl-6 text-sm">
                  {aiTips.map((tip, idx) => (
                    <li key={idx} className="text-gray-300">
                      {tip}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No suggestions available. Try again later.
                </p>
              )}

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowTipsModal(false)}
                  className="bg-purple-500 hover:bg-purple-600 text-black font-semibold py-2 px-6 rounded-full shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
