// Default categories for new users and seeding
export const DEFAULT_CATEGORIES = [
  // Expenses
  { name: "Food & Drinks",  type: "EXPENSE" as const, icon: "🍔", color: "#f97316" },
  { name: "Transport",      type: "EXPENSE" as const, icon: "🚌", color: "#3b82f6" },
  { name: "Rent",           type: "EXPENSE" as const, icon: "🏠", color: "#8b5cf6" },
  { name: "Bills",          type: "EXPENSE" as const, icon: "⚡", color: "#f59e0b" },
  { name: "Shopping",       type: "EXPENSE" as const, icon: "🛍️", color: "#ec4899" },
  { name: "Health",         type: "EXPENSE" as const, icon: "💊", color: "#ef4444" },
  { name: "Study",          type: "EXPENSE" as const, icon: "📚", color: "#06b6d4" },
  { name: "Fun",            type: "EXPENSE" as const, icon: "🎉", color: "#a855f7" },
  { name: "Other Expense",  type: "EXPENSE" as const, icon: "📦", color: "#6b7280" },
  // Income
  { name: "Salary",         type: "INCOME" as const, icon: "💼", color: "#16a34a" },
  { name: "Allowance",      type: "INCOME" as const, icon: "🎁", color: "#0f9d78" },
  { name: "Other Income",   type: "INCOME" as const, icon: "💰", color: "#84cc16" },
];
