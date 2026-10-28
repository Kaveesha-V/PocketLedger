"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Metadata } from "next";

// ─── Types ────────────────────────────────────────────────────

interface DashboardData {
  month: string;
  budget: { totalIncome: number; totalExpense: number; balance: number };
  friends: {
    totalOwedToMe: number;
    totalIOwe: number;
    friendsOwingMe: number;
    friendsIowe: number;
    top5: Array<{ id: string; name: string; net: number; lastDate: string | null }>;
  };
  categoryBreakdown: Array<{ name: string; color: string; icon: string; amount: number }>;
  dailySpending: Array<{ date: string; amount: number }>;
  overdue: Array<{
    id: string; friendName: string; friendId: string;
    amount: number; direction: string; dueDate: string; reason: string | null;
  }>;
}

// ─── Components ────────────────────────────────────────────────

function SummaryCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: string;
}) {
  return (
    <div className="card" style={{ flex: 1, minWidth: "180px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.375rem" }}>
            {label}
          </p>
          <p
            className="money"
            style={{
              fontSize: "1.5rem",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              color: color ?? "var(--text)",
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          {sub && <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{sub}</p>}
        </div>
        <span style={{ fontSize: "1.75rem", opacity: 0.8 }}>{icon}</span>
      </div>
    </div>
  );
}

function MonthSelector({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    months.push({ key, label });
  }
  return (
    <select
      className="input"
      style={{ width: "auto", fontSize: "0.875rem" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {months.map((m) => (
        <option key={m.key} value={m.key}>{m.label}</option>
      ))}
    </select>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currency = "LKR"; // TODO: get from user settings

  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/summary?month=${month}`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data); })
      .finally(() => setLoading(false));
  }, [month]);

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = session?.user?.name?.split(" ")[0] ?? "there";

  const fmt = (n: number) => formatCurrency(n, currency);

  // Loading skeletons
  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div className="skeleton" style={{ height: "2rem", width: "260px", marginBottom: "2rem" }} />
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "110px", flex: "1 1 180px", minWidth: "180px" }} />)}
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: "260px", flex: "1 1 300px" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px" }}>
      {/* ── Greeting Bar ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.125rem" }}>
            {greeting}, {name} 👋
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Here's your financial overview
          </p>
        </div>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <div
        style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}
      >
        <SummaryCard label="Balance" value={fmt(data?.budget.balance ?? 0)} icon="💰"
          color={data?.budget.balance ?? 0 >= 0 ? "var(--income)" : "var(--expense)"} />
        <SummaryCard label="Total Income" value={fmt(data?.budget.totalIncome ?? 0)} icon="📥" color="var(--income)" />
        <SummaryCard label="Total Expense" value={fmt(data?.budget.totalExpense ?? 0)} icon="📤" color="var(--expense)" />
        <SummaryCard
          label="Net with Friends"
          value={fmt((data?.friends.totalOwedToMe ?? 0) - (data?.friends.totalIOwe ?? 0))}
          icon="🤝"
          color={((data?.friends.totalOwedToMe ?? 0) - (data?.friends.totalIOwe ?? 0)) >= 0 ? "var(--income)" : "var(--expense)"}
        />
      </div>

      {/* ── Friends Snapshot ───────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div
          className="card"
          style={{ flex: 1, minWidth: "220px", borderLeft: "4px solid var(--income)" }}
        >
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.375rem" }}>🟢 Friends owe me</p>
          <p className="money" style={{ fontSize: "1.75rem", fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "var(--income)" }}>
            {fmt(data?.friends.totalOwedToMe ?? 0)}
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            {data?.friends.friendsOwingMe ?? 0} friend{data?.friends.friendsOwingMe !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          className="card"
          style={{ flex: 1, minWidth: "220px", borderLeft: "4px solid var(--expense)" }}
        >
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.375rem" }}>🔴 I owe friends</p>
          <p className="money" style={{ fontSize: "1.75rem", fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "var(--expense)" }}>
            {fmt(data?.friends.totalIOwe ?? 0)}
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            {data?.friends.friendsIowe ?? 0} friend{data?.friends.friendsIowe !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {/* Donut chart */}
        <div className="card" style={{ flex: "1 1 300px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Expense by Category</h3>
          {(data?.categoryBreakdown?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data?.categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {data?.categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(Number(v) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              No expense data this month
            </div>
          )}
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {data?.categoryBreakdown.slice(0, 6).map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c.color }} />
                {c.icon} {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* Daily spending bar */}
        <div className="card" style={{ flex: "1 1 300px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Daily Spending</h3>
          {(data?.dailySpending?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.dailySpending} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} tickFormatter={(v) => String(v || "").slice(8)} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <Tooltip formatter={(v: any) => fmt(Number(v) || 0)} labelFormatter={(l: any) => `Day ${String(l || "").slice(8)}`} />
                <Bar dataKey="amount" fill="var(--expense)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              No spending data this month
            </div>
          )}
        </div>
      </div>

      {/* ── Top 5 Friends ──────────────────────────────────────────── */}
      {(data?.friends.top5?.length ?? 0) > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Top Pending Balances</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data?.friends.top5.map((f) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: f.net > 0 ? "var(--income)" : "var(--expense)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
                  }}
                >
                  {f.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, fontSize: "0.9375rem", margin: 0 }}>{f.name}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                    {f.net > 0 ? "Owes you" : "You owe"} · Last: {f.lastDate ? formatDate(f.lastDate, "short") : "—"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="money" style={{ fontWeight: 700, color: f.net > 0 ? "var(--income)" : "var(--expense)", margin: 0 }}>
                    {fmt(Math.abs(f.net))}
                  </p>
                </div>
                <Link href={`/friends/${f.id}`} className="btn btn-ghost btn-sm">
                  Remind
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overdue Alerts ─────────────────────────────────────────── */}
      {(data?.overdue?.length ?? 0) > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            borderLeft: "4px solid var(--expense)",
            background: "color-mix(in srgb, var(--expense) 5%, var(--surface))",
          }}
        >
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--expense)" }}>
            ⚠️ Overdue ({data?.overdue.length})
          </h3>
          {data?.overdue.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0", borderTop: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: "0.875rem", margin: 0 }}>
                  {o.friendName} — {o.reason ?? "No reason"}
                </p>
                <p style={{ color: "var(--expense)", fontSize: "0.75rem", margin: 0 }}>
                  Due: {formatDate(o.dueDate, "medium")}
                </p>
              </div>
              <p className="money" style={{ fontWeight: 700, color: "var(--expense)" }}>{fmt(o.amount)}</p>
              <Link href={`/friends/${o.friendId}`} className="btn btn-sm" style={{ background: "var(--expense)", color: "#fff" }}>
                View
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick Links ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/budget" className="btn btn-primary btn-sm">+ Add expense</Link>
        <Link href="/friends" className="btn btn-ghost btn-sm">👥 Friends</Link>
        <Link href="/reports" className="btn btn-ghost btn-sm">📈 Reports</Link>
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <Link href="/ledger/new" className="fab" aria-label="Quick add">
        +
      </Link>
    </div>
  );
}
