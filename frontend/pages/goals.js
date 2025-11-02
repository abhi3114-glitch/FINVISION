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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // ✅ Fixed: Consistent state name
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
  }

  return (
    <div className="flex min-h-screen"> {/* ✅ Fixed: Simple flex container */}
      {/* ✅ Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* ✅ Sidebar with mobile responsiveness */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* ✅ Main Content Area */}
      <div className="flex-1">
        <Header
          subtitle="Track your savings and financial goals"
          user={user}
          onLogout={() => {
            API.logout();
            toast.success("Logged out successfully!");
          }}
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* Rest of your goals content */}
        <main className="p-4 lg:p-10 relative min-h-screen">
          {/* 📱 Mobile-optimized Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
            <h3 className="text-xl font-semibold text-cyan-400">Your Goals</h3>
            <button
              onClick={() => setShowModal(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto text-base"
            >
              + Add Goal
            </button>
          </div>

          {/* 📱 Mobile-optimized Goals List */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading your goals...</p>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-gray-400 text-lg mb-2">No goals found</p>
              <p className="text-gray-500 text-sm">Add your first financial goal to get started!</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-4 lg:gap-6"
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
                    className="bg-gradient-to-br from-[#0b0e20] to-[#10142d] border border-cyan-500/20 rounded-2xl p-4 lg:p-6 shadow-md hover:shadow-cyan-500/20 transition-all relative"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* 📱 Mobile-optimized Goal Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg text-cyan-400 truncate">
                          {goal.name}
                        </h4>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {goal.duration_months} months
                        </span>
                      </div>
                      
                      {/* 📱 Mobile-optimized Action Buttons */}
                      <div className="flex gap-2 ml-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedGoal(goal);
                            setShowUpdateModal(true);
                          }}
                          className="text-xs bg-cyan-600 hover:bg-cyan-500 text-black px-3 py-2 rounded-full shadow-md transition-all active:scale-95"
                          aria-label="Add savings"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => handleGetAiTips(goal)}
                          className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-full shadow-md transition-all active:scale-95"
                          aria-label="Get AI tips"
                        >
                          AI Tips
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* 📱 Mobile-optimized Progress Info */}
                    <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm text-gray-400 mb-3">
                      <div className="text-center sm:text-left">
                        <span className="text-cyan-400 font-medium block text-base">
                          ₹{goal.saved_amount?.toLocaleString() || 0}
                        </span>
                        <span className="text-xs">Saved</span>
                      </div>
                      <div className="text-center">
                        <span className="text-cyan-400 font-medium block text-base">
                          {progress}%
                        </span>
                        <span className="text-xs">Progress</span>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-purple-400 font-medium block text-base">
                          ₹{goal.target_amount?.toLocaleString()}
                        </span>
                        <span className="text-xs">Target</span>
                      </div>
                    </div>

                    {/* Progress Message */}
                    <div className="text-sm text-gray-300 mt-3">
                      {progress < 100
                        ? `💡 You're ${(
                            100 - progress
                          ).toFixed()}% away from completing your goal.`
                        : "🎉 Goal achieved! Keep saving smartly!"}
                    </div>

                    {/* 📱 Delete Button - Bottom for mobile */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowDeleteModal(true);
                        }}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full shadow-md transition-all active:scale-95"
                      >
                        Delete Goal
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* 📱 Mobile-optimized ADD GOAL MODAL */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div
                className="bg-[#0b0e20] border border-cyan-400/30 rounded-2xl p-6 w-full max-w-md"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold mb-4 text-center text-cyan-400">
                  Add New Goal
                </h3>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Goal Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Buy a Laptop"
                      value={newGoal.name}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, name: e.target.value })
                      }
                      className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Target Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter target amount"
                      value={newGoal.target_amount}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, target_amount: e.target.value })
                      }
                      className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Duration (months)</label>
                    <input
                      type="number"
                      placeholder="Enter duration in months"
                      value={newGoal.duration_months}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, duration_months: e.target.value })
                      }
                      className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 text-gray-400 hover:text-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGoal}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-5 rounded-full shadow-lg transition-all active:scale-95 text-sm"
                  >
                    Save Goal
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* 📱 Mobile-optimized UPDATE PROGRESS MODAL */}
          {showUpdateModal && selectedGoal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div
                className="bg-[#0b0e20] border border-cyan-400/30 rounded-2xl p-6 w-full max-w-md"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold mb-4 text-center text-cyan-400">
                  Add to {selectedGoal.name}
                </h3>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Amount to Add (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount to add"
                    value={updateAmount}
                    onChange={(e) => setUpdateAmount(e.target.value)}
                    className="bg-[#101426] border border-cyan-400/30 rounded-lg px-4 py-3 w-full text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="px-5 py-2 text-gray-400 hover:text-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProgress}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-5 rounded-full shadow-lg transition-all active:scale-95 text-sm"
                  >
                    Add Savings
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* 📱 Mobile-optimized DELETE CONFIRMATION MODAL */}
          {showDeleteModal && selectedGoal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div
                className="bg-[#0b0e20] border border-red-400/30 rounded-2xl p-6 w-full max-w-md text-gray-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
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
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-3 rounded-full transition-all active:scale-95 text-sm w-24"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGoalConfirm}
                    className="bg-red-500 hover:bg-red-600 text-black font-semibold px-6 py-3 rounded-full shadow-lg transition-all active:scale-95 text-sm w-24"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* 📱 Mobile-optimized AI TIPS MODAL */}
          {showTipsModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div
                className="bg-[#0b0e20] border border-purple-400/30 rounded-2xl p-6 w-full max-w-lg text-gray-200 max-h-[80vh] overflow-y-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-center text-purple-400 mb-4">
                  AI Tips for {selectedGoal?.name}
                </h3>

                {aiLoading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    Thinking like a finance guru...
                  </div>
                ) : aiTips?.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {aiTips.map((tip, idx) => (
                      <li key={idx} className="text-gray-300 bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                        <span className="text-purple-400 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm italic text-center">
                    No suggestions available. Try again later.
                  </p>
                )}

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowTipsModal(false)}
                    className="bg-purple-500 hover:bg-purple-600 text-black font-semibold py-3 px-8 rounded-full shadow-lg transition-all active:scale-95 text-sm"
                  >
                    Close Tips
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}