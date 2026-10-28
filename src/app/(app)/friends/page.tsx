"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, initials, stringToHue, formatDate } from "@/lib/format";
import type { Metadata } from "next";

interface FriendSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  balance: { net: number; timesGave: number; timesBorrowed: number };
  txCount: number;
  lastActivity: string | null;
}

type Filter = "all" | "owe-me" | "i-owe" | "settled";

function AddFriendModal({ onClose, onAdd }: { onClose: () => void; onAdd: (f: FriendSummary) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      onAdd(json.data);
      onClose();
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card animate-slide-up"
        style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Add Friend</h2>
        {error && (
          <div style={{ color: "var(--expense)", background: "color-mix(in srgb, var(--expense) 10%, transparent)", padding: "0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label className="label" htmlFor="fname">Full name *</label>
            <input id="fname" className="input" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kasun Perera" />
          </div>
          <div className="field">
            <label className="label" htmlFor="femail">Email <span style={{ fontWeight: 400, color: "var(--muted)" }}>(for reminders)</span></label>
            <input id="femail" className="input" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="kasun@example.com" />
          </div>
          <div className="field">
            <label className="label" htmlFor="fphone">WhatsApp number</label>
            <input id="fphone" className="input" type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+94771234567" />
          </div>
          <div className="field">
            <label className="label" htmlFor="fnote">Note</label>
            <input id="fnote" className="input" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Roommate, classmate…" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button id="btn-add-friend" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Adding…" : "Add Friend"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const currency = "LKR";

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((j) => { if (j.data) setFriends(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = friends.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "owe-me" && f.balance.net <= 0.01) return false;
    if (filter === "i-owe" && f.balance.net >= -0.01) return false;
    if (filter === "settled" && Math.abs(f.balance.net) > 0.01) return false;
    return true;
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "owe-me", label: "🟢 They owe me" },
    { id: "i-owe", label: "🔴 I owe them" },
    { id: "settled", label: "✅ Settled" },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <h1>Friends & Ledger</h1>
        <button id="btn-open-add-friend" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Friend
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: "1 1 200px", maxWidth: "280px" }}
          placeholder="🔍 Search friends…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {FILTERS.map((fl) => (
            <button
              key={fl.id}
              className="btn btn-sm"
              style={{
                background: filter === fl.id ? "var(--primary)" : "var(--surface)",
                color: filter === fl.id ? "#fff" : "var(--text)",
                border: `1px solid ${filter === fl.id ? "var(--primary)" : "var(--border)"}`,
              }}
              onClick={() => setFilter(fl.id)}
            >
              {fl.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "88px" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No friends yet</h3>
          <p style={{ marginBottom: "1.5rem" }}>Add your first friend to start tracking money.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Friend</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((f) => {
            const hue = stringToHue(f.name);
            const net = f.balance.net;
            const netColor = net > 0.01 ? "var(--income)" : net < -0.01 ? "var(--expense)" : "var(--muted)";
            const netLabel = net > 0.01 ? `Owes you ${formatCurrency(net, currency)}` : net < -0.01 ? `You owe ${formatCurrency(Math.abs(net), currency)}` : "Settled ✅";
            return (
              <Link
                key={f.id}
                href={`/friends/${f.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                  <div style={{
                    width: "46px", height: "46px", borderRadius: "50%",
                    background: `hsl(${hue}, 55%, 50%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
                  }}>
                    {initials(f.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>{f.name}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0.125rem 0 0" }}>
                      {f.txCount} transaction{f.txCount !== 1 ? "s" : ""} ·{" "}
                      {f.lastActivity ? `Last: ${formatDate(f.lastActivity, "short")}` : "No activity"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="money" style={{ fontWeight: 700, color: netColor, margin: 0, fontSize: "0.9375rem" }}>
                      {net > 0.01 || net < -0.01 ? formatCurrency(Math.abs(net), currency) : "—"}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: netColor, margin: "0.125rem 0 0" }}>{netLabel}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddFriendModal
          onClose={() => setShowModal(false)}
          onAdd={(f) => setFriends((prev) => [...prev, f])}
        />
      )}

      <Link href="/ledger/new" className="fab" aria-label="Quick add transaction">+</Link>
    </div>
  );
}
