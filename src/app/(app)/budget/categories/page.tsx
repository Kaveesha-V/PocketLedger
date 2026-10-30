"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Tag,
  Utensils,
  Car,
  Home,
  Zap,
  ShoppingBag,
  HeartPulse,
  BookOpen,
  Gamepad2,
  Wallet,
  Briefcase,
  Gift,
  Plane,
  Coffee,
  Smartphone,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  Check,
  AlertCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string | null;
  icon?: string | null;
  _count?: { entries: number };
}

const PRESET_COLORS = [
  "#8b5cf6", "#7c3aed", "#16a34a", "#0f9d78", "#2dd4a4", "#3b82f6",
  "#ec4899", "#ef4444", "#f97316", "#eab308", "#64748b",
];

const PRESET_ICONS = [
  { id: "Tag", label: "Tag", Icon: Tag },
  { id: "Utensils", label: "Food & Drinks", Icon: Utensils },
  { id: "Car", label: "Transport", Icon: Car },
  { id: "Home", label: "Housing & Rent", Icon: Home },
  { id: "Zap", label: "Bills & Utilities", Icon: Zap },
  { id: "ShoppingBag", label: "Shopping", Icon: ShoppingBag },
  { id: "HeartPulse", label: "Healthcare", Icon: HeartPulse },
  { id: "BookOpen", label: "Education & Study", Icon: BookOpen },
  { id: "Gamepad2", label: "Entertainment", Icon: Gamepad2 },
  { id: "Wallet", label: "Income & Finance", Icon: Wallet },
  { id: "Briefcase", label: "Salary & Work", Icon: Briefcase },
  { id: "Gift", label: "Gifts & Allowance", Icon: Gift },
  { id: "Plane", label: "Travel", Icon: Plane },
  { id: "Coffee", label: "Cafe & Snacks", Icon: Coffee },
  { id: "Smartphone", label: "Phone & Subscriptions", Icon: Smartphone },
];

function CategoryIcon({ icon, size = 18 }: { icon?: string | null; size?: number }) {
  const match = PRESET_ICONS.find((p) => p.id.toLowerCase() === (icon || "").toLowerCase());
  if (match) {
    const Component = match.Icon;
    return <Component size={size} />;
  }
  return <Tag size={size} />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");

  // Create form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [color, setColor] = useState("#8b5cf6");
  const [icon, setIcon] = useState("Tag");
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
    setColor("#8b5cf6");
    setIcon("Tag");
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function openEditModal(c: Category) {
    setEditingCategory(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color || "#8b5cf6");
    setIcon(c.icon || "Tag");
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

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ text: string; error?: boolean } | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setActionNotice({ text: "Category deleted successfully" });
        setTimeout(() => setActionNotice(null), 3000);
      } else {
        const json = await res.json();
        setActionNotice({ text: json.error || "Could not delete category", error: true });
      }
    } catch {
      setActionNotice({ text: "Error deleting category. Please try again.", error: true });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filtered = categories.filter((c) => {
    if (filterType === "ALL") return true;
    return c.type === filterType;
  });

  return (
    <div className="page-container" style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/budget" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <ChevronLeft size={16} /> Back to Budget Sheet
            </Link>
          </div>
          <h1>Manage Categories</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {actionNotice && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: actionNotice.error ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)",
            color: actionNotice.error ? "var(--expense)" : "var(--income)",
            border: `1px solid ${actionNotice.error ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
          }}
        >
          {actionNotice.error ? <AlertCircle size={16} /> : <Check size={16} />}
          {actionNotice.text}
        </div>
      )}

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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <Tag size={40} />
          </div>
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
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: cat.color || "var(--primary)",
                  }}
                >
                  <CategoryIcon icon={cat.icon} size={20} />
                </div>
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
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "0.25rem 0.5rem", color: "var(--expense)" }}
                  onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                  title="Delete"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 size={14} />
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
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
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
              <p style={{ color: "var(--expense)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <AlertCircle size={14} /> {errorMsg}
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
                <label className="label">Vector Icon</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {PRESET_ICONS.map((p) => {
                    const Selected = icon.toLowerCase() === p.id.toLowerCase();
                    const IconComp = p.Icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        style={{
                          height: "42px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: Selected ? "2px solid var(--primary)" : "1px solid var(--border)",
                          borderRadius: "8px",
                          background: Selected ? "rgba(139, 92, 246, 0.2)" : "var(--surface-2)",
                          color: Selected ? "var(--primary)" : "var(--text)",
                          cursor: "pointer",
                        }}
                        title={p.label}
                        onClick={() => setIcon(p.id)}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
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

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name}"?`}
        message={`Are you sure you want to delete the category "${deleteTarget?.name}"? Existing budget entries will become uncategorized.`}
        confirmText="Delete Category"
        variant="danger"
        icon={<Trash2 size={22} />}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
