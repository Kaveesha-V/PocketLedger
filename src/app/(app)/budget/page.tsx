"use client";

import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { formatCurrency, formatDate, toISODate } from "@/lib/format";
import type { Metadata } from "next";

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
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
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
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetEntry>>({});
  const [newRow, setNewRow] = useState({
    date: toISODate(new Date()),
    title: "",
    categoryId: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    method: "",
    note: "",
  });

  function load() {
    setLoading(true);
    Promise.all([
      fetch(`/api/budget?month=${month}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([bj, cj]) => {
      if (bj.data) setEntries(bj.data.map((e: BudgetEntry) => ({ ...e, amount: Number(e.amount) })));
      if (cj.data) setCategories(cj.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [month]);

  const totalIncome = entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const filtered = entries.filter((e) => {
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function addEntry() {
    if (!newRow.title || !newRow.amount) return;
    setSaving(true);
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newRow, amount: parseFloat(newRow.amount), categoryId: newRow.categoryId || null }),
    });
    const json = await res.json();
    if (json.data) {
      setEntries((prev) => [...prev, { ...json.data, amount: Number(json.data.amount) }]);
      setNewRow({ date: toISODate(new Date()), title: "", categoryId: "", type: "EXPENSE", amount: "", method: "", note: "" });
      showSaved();
    }
    setSaving(false);
  }

  function showSaved() {
    setSavedMsg("Saved ✓");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/budget/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });
    const json = await res.json();
    if (json.data) {
      setEntries((prev) => prev.map((e) => e.id === id ? { ...json.data, amount: Number(json.data.amount) } : e));
      showSaved();
    }
    setEditingId(null);
    setEditValues({});
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/budget/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showSaved();
  }

  function startEdit(e: BudgetEntry) {
    setEditingId(e.id);
    setEditValues({ ...e, date: toISODate(new Date(e.date)) });
  }

  function cancelEdit() { setEditingId(null); setEditValues({}); }

  function cellKeyDown(ev: KeyboardEvent, id: string) {
    if (ev.key === "Enter") saveEdit(id);
    if (ev.key === "Escape") cancelEdit();
  }

  function handleNewRowKey(ev: KeyboardEvent) {
    if (ev.ctrlKey && ev.key === "Enter") addEntry();
  }

  const catOptions = (type: "INCOME" | "EXPENSE") => categories.filter((c) => c.type === type);

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <h1>Budget Sheet</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {savedMsg && <span style={{ color: "var(--income)", fontSize: "0.875rem", fontWeight: 500 }}>{savedMsg}</span>}
          <select className="input" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(e.target.value)}>
            {getMonthOptions().map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input className="input" style={{ flex: "1 1 200px", maxWidth: "260px" }} placeholder="🔍 Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
          <button key={t} className="btn btn-sm"
            style={{ border: `1px solid ${typeFilter === t ? "var(--primary)" : "var(--border)"}`, background: typeFilter === t ? "var(--primary)" : "transparent", color: typeFilter === t ? "#fff" : "var(--text)" }}
            onClick={() => setTypeFilter(t)}>
            {t === "ALL" ? "All" : t === "INCOME" ? "💚 Income" : "🔴 Expense"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ marginBottom: "1.25rem" }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th>Method</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>No entries yet. Add the first row below.</td></tr>
            ) : filtered.map((e) => {
              const isEditing = editingId === e.id;
              return (
                <tr key={e.id} style={{ background: isEditing ? "color-mix(in srgb, var(--primary) 5%, transparent)" : undefined }}>
                  <td>{isEditing ? <input className="input" type="date" value={String(editValues.date ?? "")} onChange={(ev) => setEditValues(v => ({ ...v, date: ev.target.value }))} onKeyDown={(ev) => cellKeyDown(ev, e.id)} /> : <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{formatDate(e.date, "short")}</span>}</td>
                  <td>{isEditing ? <input className="input" value={String(editValues.title ?? "")} onChange={(ev) => setEditValues(v => ({ ...v, title: ev.target.value }))} onKeyDown={(ev) => cellKeyDown(ev, e.id)} /> : <span style={{ fontWeight: 500 }}>{e.title}</span>}</td>
                  <td>{isEditing ? (
                    <select className="input" value={String(editValues.categoryId ?? "")} onChange={(ev) => setEditValues(v => ({ ...v, categoryId: ev.target.value || null }))}>
                      <option value="">—</option>
                      {catOptions(editValues.type as "INCOME" | "EXPENSE" ?? e.type).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: "0.8125rem" }}>{e.category?.icon} {e.category?.name ?? "—"}</span>
                  )}</td>
                  <td>{isEditing ? (
                    <select className="input" style={{ width: "auto" }} value={String(editValues.type ?? e.type)} onChange={(ev) => setEditValues(v => ({ ...v, type: ev.target.value as "INCOME" | "EXPENSE", categoryId: "" }))}>
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  ) : (
                    <span className={`badge ${e.type === "INCOME" ? "badge-income" : "badge-expense"}`}>{e.type === "INCOME" ? "Income" : "Expense"}</span>
                  )}</td>
                  <td style={{ textAlign: "right" }}>
                    {isEditing ? <input className="input" type="number" step="0.01" style={{ textAlign: "right" }} value={String(editValues.amount ?? "")} onChange={(ev) => setEditValues(v => ({ ...v, amount: parseFloat(ev.target.value) }))} onKeyDown={(ev) => cellKeyDown(ev, e.id)} /> : (
                      <span className="money" style={{ fontWeight: 600, color: e.type === "INCOME" ? "var(--income)" : "var(--expense)" }}>{formatCurrency(e.amount, currency)}</span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{isEditing ? <select className="input" value={String(editValues.method ?? "")} onChange={(ev) => setEditValues(v => ({ ...v, method: ev.target.value || null }))}><option value="">—</option>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select> : (e.method ?? "—")}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{isEditing ? <input className="input" value={String(editValues.note ?? "")} onChange={(ev) => setEditValues(v => ({ ...v, note: ev.target.value || null }))} onKeyDown={(ev) => cellKeyDown(ev, e.id)} /> : (e.note ?? "—")}</td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button className="btn btn-sm" style={{ background: "var(--primary)", color: "#fff", padding: "0.25rem 0.5rem" }} onClick={() => saveEdit(e.id)}>✓</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }} onClick={cancelEdit}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }} onClick={() => startEdit(e)} title="Edit">✏️</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }} onClick={() => deleteEntry(e.id)} title="Delete">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* New row */}
            <tr style={{ background: "color-mix(in srgb, var(--primary) 4%, transparent)" }}>
              <td><input className="input" type="date" value={newRow.date} onChange={(e) => setNewRow(r => ({ ...r, date: e.target.value }))} onKeyDown={handleNewRowKey} /></td>
              <td><input className="input" placeholder="Description…" value={newRow.title} onChange={(e) => setNewRow(r => ({ ...r, title: e.target.value }))} onKeyDown={handleNewRowKey} /></td>
              <td>
                <select className="input" value={newRow.categoryId} onChange={(e) => setNewRow(r => ({ ...r, categoryId: e.target.value }))}>
                  <option value="">—</option>
                  {catOptions(newRow.type).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </td>
              <td>
                <select className="input" style={{ width: "auto" }} value={newRow.type} onChange={(e) => setNewRow(r => ({ ...r, type: e.target.value as "INCOME" | "EXPENSE", categoryId: "" }))}>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </td>
              <td><input className="input" type="number" step="0.01" placeholder="0.00" style={{ textAlign: "right" }} value={newRow.amount} onChange={(e) => setNewRow(r => ({ ...r, amount: e.target.value }))} onKeyDown={handleNewRowKey} /></td>
              <td><select className="input" value={newRow.method} onChange={(e) => setNewRow(r => ({ ...r, method: e.target.value }))}><option value="">—</option>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></td>
              <td><input className="input" placeholder="Note…" value={newRow.note} onChange={(e) => setNewRow(r => ({ ...r, note: e.target.value }))} onKeyDown={handleNewRowKey} /></td>
              <td>
                <button id="btn-add-budget-row" className="btn btn-sm btn-primary" onClick={addEntry} disabled={saving || !newRow.title || !newRow.amount}>
                  {saving ? "…" : "+ Add"}
                </button>
              </td>
            </tr>
          </tbody>

          {/* Footer totals */}
          <tfoot>
            <tr style={{ background: "var(--surface-2)", fontWeight: 700 }}>
              <td colSpan={4} style={{ padding: "0.75rem 1rem", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem" }}>
                Totals · <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8rem" }}>Ctrl+Enter to add row</span>
              </td>
              <td style={{ textAlign: "right", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                  <span className="money" style={{ color: "var(--income)", fontSize: "0.8125rem" }}>+{formatCurrency(totalIncome, currency)}</span>
                  <span className="money" style={{ color: "var(--expense)", fontSize: "0.8125rem" }}>-{formatCurrency(totalExpense, currency)}</span>
                  <span className="money" style={{ color: balance >= 0 ? "var(--income)" : "var(--expense)", fontSize: "0.9375rem", fontWeight: 700 }}>{formatCurrency(balance, currency)}</span>
                </div>
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>💡 Click any cell to edit · Enter to save · Esc to cancel · Ctrl+Enter to add new row</p>
    </div>
  );
}
