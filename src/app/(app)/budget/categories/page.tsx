"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string | null;
  icon?: string | null;
  _count?: { entries: number };
}

const PRESET_COLORS = [
  "#16a34a", "#0f9d78", "#2dd4a4", "#3b82f6",
  "#8b5cf6", "#ec4899", "#e5484d", "#f97316",
  "#eab308", "#64748b",
];

const PRESET_ICONS = [
  "🍔", "🚗", "🏠", "💡", "🛍️", "💊", "📚", "🎮", "💰", "💼", "🎁", "✈️", "☕", "📱"
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");

  // Create form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [color, setColor] = useState("#0f9d78");
  const [icon, setIcon] = useState("🏷️");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.data) setCategories(json.data);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setName("");
    setType("EXPENSE");
    setColor("#0f9d78");
    setIcon("🏷️");
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function openEditModal(c: Category) {
    setEditingCategory(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color || "#0f9d78");
    setIcon(c.icon || "🏷️");
    setErrorMsg("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a category name");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, color, icon }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Failed to save category");
      } else {
        setIsModalOpen(false);
        fetchCategories();
      }
    } catch {
      setErrorMsg("Network error saving category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        const json = await res.json();
        alert(json.error || "Could not delete category");
      }
    } catch {
      alert("Error deleting category");
    }
  }

  const filtered = categories.filter((c) => {
    if (filterType === "ALL") return true;
    return c.type === filterType;
  });

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/budget" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              ← Back to Budget Sheet
            </Link>
          </div>
          <h1>Manage Categories</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Add Category
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["ALL", "EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${filterType === t ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterType(t)}
          >
            {t === "ALL" ? "All Categories" : t === "EXPENSE" ? "Expenses" : "Income"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: "90px" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏷️</p>
          <h3>No categories found</h3>
          <p>Create your first custom category to organize your spending and income.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderLeft: `4px solid ${cat.color || "var(--primary)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{cat.icon || "🏷️"}</span>
                <div>
                  <h4 style={{ fontSize: "1rem", margin: 0 }}>{cat.name}</h4>
                  <span
                    className={`badge ${cat.type === "INCOME" ? "badge-primary" : "badge-accent"}`}
                    style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}
                  >
                    {cat.type}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "0.25rem 0.5rem" }}
                  onClick={() => openEditModal(cat)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "0.25rem 0.5rem", color: "var(--expense)" }}
                  onClick={() => handleDelete(cat.id, cat.name)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "460px", background: "var(--surface)" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
              {editingCategory ? "Edit Category" : "New Category"}
            </h2>

            {errorMsg && (
              <p style={{ color: "var(--expense)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Category Name</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. Groceries, Freelance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Type</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${type === "EXPENSE" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setType("EXPENSE")}
                    style={{ flex: 1 }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${type === "INCOME" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setType("INCOME")}
                    style={{ flex: 1 }}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Icon</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  {PRESET_ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      style={{
                        fontSize: "1.25rem",
                        padding: "0.35rem 0.5rem",
                        border: icon === i ? "2px solid var(--primary)" : "1px solid var(--border)",
                        borderRadius: "8px",
                        background: icon === i ? "var(--surface-2)" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => setIcon(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Color Accent</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: c,
                        border: color === c ? "3px solid var(--text)" : "none",
                        cursor: "pointer",
                      }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: "36px", height: "30px", border: "none", cursor: "pointer", background: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
