"use client";

import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { formatCurrency, formatDate, toISODate } from "@/lib/format";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Trash2,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string | null;
  icon: string | null;
}

interface BudgetEntry {
  id: string;
  date: string;
  title: string;
  categoryId: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  method: string | null;
  note: string | null;
  category: Category | null;
}

const METHODS = ["Cash", "Card", "Bank Transfer", "Wallet", "Other"];

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    options.push({ key, label });
  }
  return options;
}

export default function BudgetPage() {
  const currency = "LKR";
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetEntry>>({});

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New row inputs state
  const [newRow, setNewRow] = useState({
    date: toISODate(new Date()),
    title: "",
    categoryId: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    method: "Cash",
    note: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      fetch(`/api/budget?month=${month}`).then(async (r) => {
        if (!r.ok) throw new Error("Failed to load budget entries");
        return r.json();
      }),
      fetch("/api/categories").then(async (r) => {
        if (!r.ok) return { data: [] };
        return r.json();
      }),
    ])
      .then(([bj, cj]) => {
        if (bj.data) {
          setEntries(bj.data.map((e: BudgetEntry) => ({ ...e, amount: Number(e.amount) })));
        }
        if (cj.data) {
          setCategories(cj.data);
        }
      })
      .catch((err) => {
        console.error("Budget load error:", err);
        setLoadError("Unable to load budget data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const totalIncome = entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const filtered = entries.filter((e) => {
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function showSaved(msg = "Saved") {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2500);
  }

  async function addEntry() {
    if (!newRow.title.trim() || !newRow.amount || parseFloat(newRow.amount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRow,
          amount: parseFloat(newRow.amount),
          categoryId: newRow.categoryId || null,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setEntries((prev) => [...prev, { ...json.data, amount: Number(json.data.amount) }]);
        setNewRow({
          date: toISODate(new Date()),
          title: "",
          categoryId: "",
          type: newRow.type,
          amount: "",
          method: newRow.method,
          note: "",
        });
        showSaved("Added to budget");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editValues.title?.trim() || !editValues.amount || editValues.amount <= 0) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/budget/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      const json = await res.json();
      if (json.data) {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...json.data, amount: Number(json.data.amount) } : e)));
        showSaved("Updated");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditingId(null);
      setEditValues({});
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/budget/${deleteId}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== deleteId));
      showSaved("Deleted");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function startEdit(e: BudgetEntry) {
    setEditingId(e.id);
    setEditValues({
      ...e,
      date: toISODate(new Date(e.date)),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  function cellKeyDown(ev: KeyboardEvent, id: string) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      saveEdit(id);
    }
    if (ev.key === "Escape") {
      cancelEdit();
    }
  }

  function handleNewRowKey(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      addEntry();
    }
  }

  const catOptions = (type: "INCOME" | "EXPENSE") => categories.filter((c) => c.type === type);

  return (
    <div className="page-container">
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Budget Sheet</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            Log and manage your daily income and expenses
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {savedMsg && (
            <span style={{ color: "var(--income)", fontSize: "0.875rem", fontWeight: 600, animation: "fadeIn 200ms" }}>
              <><Check size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />{savedMsg}</>
            </span>
          )}
          <select
            className="input"
            style={{ width: "auto", fontWeight: 500 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {getMonthOptions().map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div className="card" style={{ flex: 1, minWidth: "160px", padding: "1rem 1.25rem", borderLeft: "4px solid var(--income)" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Total Income</p>
          <p className="money" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--income)", margin: "0.25rem 0 0" }}>
            +{formatCurrency(totalIncome, currency)}
          </p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: "160px", padding: "1rem 1.25rem", borderLeft: "4px solid var(--expense)" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Total Expense</p>
          <p className="money" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--expense)", margin: "0.25rem 0 0" }}>
            -{formatCurrency(totalExpense, currency)}
          </p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: "160px", padding: "1rem 1.25rem", borderLeft: `4px solid ${balance >= 0 ? "var(--income)" : "var(--expense)}"}` }}>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Net Monthly Balance</p>
          <p className="money" style={{ fontSize: "1.25rem", fontWeight: 700, color: balance >= 0 ? "var(--income)" : "var(--expense)", margin: "0.25rem 0 0" }}>
            {formatCurrency(balance, currency)}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: "1 1 200px", maxWidth: "260px" }}
          placeholder="Search entries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
          <button
            key={t}
            className="btn btn-sm"
            style={{
              border: `1px solid ${typeFilter === t ? "var(--primary)" : "var(--border)"}`,
              background: typeFilter === t ? "var(--primary)" : "var(--surface)",
              color: typeFilter === t ? "#fff" : "var(--text)",
              fontWeight: typeFilter === t ? 600 : 400,
            }}
            onClick={() => setTypeFilter(t)}
          >
            {t === "ALL" ? "All" : t === "INCOME" ? <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><ArrowUpRight size={14} /> Income</span> : <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><ArrowDownLeft size={14} /> Expense</span>}
          </button>
        ))}
      </div>

      {/* Mobile Quick Add Form (< 768px) */}
      <div className="card mobile-budget-form" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.875rem" }}><Plus size={16} /> Add Budget Entry</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className="btn btn-sm"
              style={{
                flex: 1,
                border: `2px solid ${newRow.type === t ? (t === "INCOME" ? "var(--income)" : "var(--expense)") : "var(--border)"}`,
                background: newRow.type === t ? (t === "INCOME" ? "color-mix(in srgb, var(--income) 15%, transparent)" : "color-mix(in srgb, var(--expense) 15%, transparent)") : "transparent",
                color: newRow.type === t ? (t === "INCOME" ? "var(--income)" : "var(--expense)") : "var(--text)",
                fontWeight: newRow.type === t ? 600 : 400,
              }}
              onClick={() => setNewRow((r) => ({ ...r, type: t, categoryId: "" }))}
            >
              {t === "INCOME" ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><ArrowDownLeft size={14} /> Income</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><ArrowUpRight size={14} /> Expense</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="e.g. Lunch"
              value={newRow.title}
              onChange={(e) => setNewRow((r) => ({ ...r, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Amount ({currency}) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={newRow.amount}
              onChange={(e) => setNewRow((r) => ({ ...r, amount: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={newRow.categoryId}
              onChange={(e) => setNewRow((r) => ({ ...r, categoryId: e.target.value }))}
            >
              <option value="">— Select Category —</option>
              {catOptions(newRow.type).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select
              className="input"
              value={newRow.method}
              onChange={(e) => setNewRow((r) => ({ ...r, method: e.target.value }))}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={newRow.date}
              onChange={(e) => setNewRow((r) => ({ ...r, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input
              className="input"
              placeholder="Note…"
              value={newRow.note}
              onChange={(e) => setNewRow((r) => ({ ...r, note: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", fontWeight: 600 }}
          onClick={addEntry}
          disabled={saving || !newRow.title.trim() || !newRow.amount}
        >
          {saving ? "Adding…" : `+ Add ${newRow.type === "INCOME" ? "Income" : "Expense"}`}
        </button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-budget-form { display: none !important; }
        }
      `}</style>

      {/* Table Container */}
      <div className="table-wrap" style={{ marginBottom: "1.25rem" }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: "130px" }}>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th style={{ width: "110px" }}>Type</th>
              <th style={{ textAlign: "right", width: "130px" }}>Amount</th>
              <th>Method</th>
              <th>Note</th>
              <th style={{ textAlign: "center", width: "90px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><Loader2 size={16} className="animate-spin" /> Loading your budget records…</span>
                  </div>
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--expense)" }}>
                  <p style={{ margin: "0 0 0.5rem" }}><AlertCircle size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} /> {loadError}</p>
                  <button className="btn btn-sm btn-ghost" onClick={load}>
                    <RotateCcw size={14} /> Retry
                  </button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                  No entries for this month yet. Use the input row below to add your first expense or income!
                </td>
              </tr>
            ) : (
              filtered.map((e) => {
                const isEditing = editingId === e.id;
                return (
                  <tr
                    key={e.id}
                    onDoubleClick={() => !isEditing && startEdit(e)}
                    style={{
                      background: isEditing ? "color-mix(in srgb, var(--primary) 8%, transparent)" : undefined,
                      cursor: isEditing ? "default" : "pointer",
                    }}
                    title={isEditing ? "" : "Double-click or click pencil to edit"}
                  >
                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          type="date"
                          value={String(editValues.date ?? "")}
                          onChange={(ev) => setEditValues((v) => ({ ...v, date: ev.target.value }))}
                          onKeyDown={(ev) => cellKeyDown(ev, e.id)}
                        />
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          {formatDate(e.date, "short")}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="input"
                          autoFocus
                          value={String(editValues.title ?? "")}
                          onChange={(ev) => setEditValues((v) => ({ ...v, title: ev.target.value }))}
                          onKeyDown={(ev) => cellKeyDown(ev, e.id)}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{e.title}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="input"
                          value={String(editValues.categoryId ?? "")}
                          onChange={(ev) => setEditValues((v) => ({ ...v, categoryId: ev.target.value || null }))}
                        >
                          <option value="">— Uncategorized —</option>
                          {catOptions((editValues.type as "INCOME" | "EXPENSE") ?? e.type).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: "0.8125rem" }}>
                          {e.category?.icon} {e.category?.name ?? "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="input"
                          style={{ width: "auto" }}
                          value={String(editValues.type ?? e.type)}
                          onChange={(ev) =>
                            setEditValues((v) => ({
                              ...v,
                              type: ev.target.value as "INCOME" | "EXPENSE",
                              categoryId: "",
                            }))
                          }
                        >
                          <option value="INCOME">Income</option>
                          <option value="EXPENSE">Expense</option>
                        </select>
                      ) : (
                        <span className={`badge ${e.type === "INCOME" ? "badge-income" : "badge-expense"}`}>
                          {e.type === "INCOME" ? "Income" : "Expense"}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          style={{ textAlign: "right" }}
                          value={String(editValues.amount ?? "")}
                          onChange={(ev) => setEditValues((v) => ({ ...v, amount: parseFloat(ev.target.value) }))}
                          onKeyDown={(ev) => cellKeyDown(ev, e.id)}
                        />
                      ) : (
                        <span
                          className="money"
                          style={{
                            fontWeight: 600,
                            color: e.type === "INCOME" ? "var(--income)" : "var(--expense)",
                          }}
                        >
                          {e.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(e.amount, currency)}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      {isEditing ? (
                        <select
                          className="input"
                          value={String(editValues.method ?? "")}
                          onChange={(ev) => setEditValues((v) => ({ ...v, method: ev.target.value || null }))}
                        >
                          <option value="">—</option>
                          {METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      ) : (
                        e.method ?? "—"
                      )}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      {isEditing ? (
                        <input
                          className="input"
                          value={String(editValues.note ?? "")}
                          onChange={(ev) => setEditValues((v) => ({ ...v, note: ev.target.value || null }))}
                          onKeyDown={(ev) => cellKeyDown(ev, e.id)}
                        />
                      ) : (
                        e.note ?? "—"
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {isEditing ? (
                        <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ background: "var(--primary)", color: "#fff", padding: "0.25rem 0.5rem" }}
                            onClick={() => saveEdit(e.id)}
                            title="Save"
                          ><Check size={14} /></button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "0.25rem 0.5rem" }}
                            onClick={cancelEdit}
                            title="Cancel"
                          ><X size={14} /></button>
                        </div>
                      ) : (
                        <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "0.25rem 0.5rem" }}
                            onClick={() => startEdit(e)}
                            title="Edit entry"
                          ><Pencil size={14} /></button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "0.25rem 0.5rem", color: "var(--expense)" }}
                            onClick={() => setDeleteId(e.id)}
                            title="Delete entry"
                          ><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}

            {/* New Entry Row */}
            <tr style={{ background: "color-mix(in srgb, var(--primary) 6%, transparent)", borderTop: "2px solid var(--border)" }}>
              <td>
                <input
                  className="input"
                  type="date"
                  value={newRow.date}
                  onChange={(e) => setNewRow((r) => ({ ...r, date: e.target.value }))}
                  onKeyDown={handleNewRowKey}
                />
              </td>
              <td>
                <input
                  className="input"
                  placeholder="e.g. Lunch, Grocery…"
                  value={newRow.title}
                  onChange={(e) => setNewRow((r) => ({ ...r, title: e.target.value }))}
                  onKeyDown={handleNewRowKey}
                />
              </td>
              <td>
                <select
                  className="input"
                  value={newRow.categoryId}
                  onChange={(e) => setNewRow((r) => ({ ...r, categoryId: e.target.value }))}
                >
                  <option value="">— Select Category —</option>
                  {catOptions(newRow.type).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="input"
                  style={{ width: "auto" }}
                  value={newRow.type}
                  onChange={(e) => setNewRow((r) => ({ ...r, type: e.target.value as "INCOME" | "EXPENSE", categoryId: "" }))}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </td>
              <td>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  style={{ textAlign: "right" }}
                  value={newRow.amount}
                  onChange={(e) => setNewRow((r) => ({ ...r, amount: e.target.value }))}
                  onKeyDown={handleNewRowKey}
                />
              </td>
              <td>
                <select
                  className="input"
                  value={newRow.method}
                  onChange={(e) => setNewRow((r) => ({ ...r, method: e.target.value }))}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className="input"
                  placeholder="Note (optional)…"
                  value={newRow.note}
                  onChange={(e) => setNewRow((r) => ({ ...r, note: e.target.value }))}
                  onKeyDown={handleNewRowKey}
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  id="btn-add-budget-row"
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={addEntry}
                  disabled={saving || !newRow.title.trim() || !newRow.amount}
                  style={{ width: "100%", padding: "0.4rem 0.6rem", fontWeight: 600 }}
                >
                  {saving ? "…" : "+ Add"}
                </button>
              </td>
            </tr>
          </tbody>

          {/* Footer totals */}
          <tfoot>
            <tr style={{ background: "var(--surface-2)", fontWeight: 700 }}>
              <td colSpan={4} style={{ padding: "0.875rem 1rem", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem" }}>
                Monthly Summary ·{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8rem" }}>
                  Press Enter in inputs to quickly save/add
                </span>
              </td>
              <td style={{ textAlign: "right", padding: "0.875rem 1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                  <span className="money" style={{ color: "var(--income)", fontSize: "0.8125rem" }}>
                    +{formatCurrency(totalIncome, currency)}
                  </span>
                  <span className="money" style={{ color: "var(--expense)", fontSize: "0.8125rem" }}>
                    -{formatCurrency(totalExpense, currency)}
                  </span>
                  <span
                    className="money"
                    style={{
                      color: balance >= 0 ? "var(--income)" : "var(--expense)",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  >
                    {formatCurrency(balance, currency)}
                  </span>
                </div>
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
        <Info size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Double-click any row to edit · Press Enter to save · Esc to cancel · Type in the bottom row and hit Enter to quickly add
      </p>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Budget Entry"
        message="Are you sure you want to delete this budget entry? This action cannot be undone."
        confirmText="Delete Entry"
        variant="danger"
        icon={<Trash2 size={22} style={{ color: "var(--expense)" }} />}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
