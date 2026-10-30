"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatDate, initials, stringToHue } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";

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
  recentActivity: Array<{
    id: string;
    type: "budget";
    title: string;
    amount: number;
    entryType: "INCOME" | "EXPENSE";
    date: string;
    category: string | null;
  }>;
  recentLedger: Array<{
    id: string;
    friendId: string;
    friendName: string;
    direction: "I_GAVE" | "I_BORROWED" | "THEY_REPAID" | "I_REPAID";
    amount: number;
    date: string;
    reason: string | null;
    settled: boolean;
  }>;
  overdue: Array<{
    id: string;
    friendName: string;
    friendId: string;
    amount: number;
    direction: string;
    dueDate: string;
    reason: string | null;
  }>;
}

const DIRECTION_LABELS: Record<string, { label: string; color: string; sign: "+" | "-" }> = {
  I_GAVE: { label: "I gave", color: "var(--income)", sign: "+" },
  I_BORROWED: { label: "I borrowed", color: "var(--expense)", sign: "-" },
  THEY_REPAID: { label: "They repaid", color: "var(--income)", sign: "+" },
  I_REPAID: { label: "I repaid", color: "var(--expense)", sign: "-" },
};

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
      style={{ width: "auto", fontSize: "0.875rem", fontWeight: 500 }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {months.map((m) => (
        <option key={m.key} value={m.key}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currency = "LKR";

  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/summary?month=${month}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch((e) => console.error("Dashboard error:", e))
      .finally(() => setLoading(false));
  }, [month]);

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = session?.user?.name?.split(" ")[0] ?? "there";

  const fmt = (n: number) => formatCurrency(n, currency);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: "2.5rem", width: "280px", marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "var(--radius)" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: "280px", borderRadius: "var(--radius)" }} />
          ))}
        </div>
      </div>
    );
  }

  const netFriendBalance = (data?.friends.totalOwedToMe ?? 0) - (data?.friends.totalIOwe ?? 0);

  return (
    <div className="page-container">
      {/* ── Top Header & Greeting ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "clamp(1.25rem, 5vw, 1.625rem)",
              marginBottom: "0.2rem",
              lineHeight: 1.25,
            }}
          >
            {greeting}, {name}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.8125rem", margin: 0 }}>
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <MonthSelector value={month} onChange={setMonth} />
          <ThemeToggle />
        </div>
      </div>

      {/* ── Quick Action Buttons (Useful Shortcuts) ───────────────── */}
      <div className="dashboard-actions-grid">
        <Link
          href="/ledger/new?direction=I_GAVE"
          className="card card-interactive dashboard-action-item"
          style={{
            border: "1px solid color-mix(in srgb, var(--income) 30%, transparent)",
            background: "color-mix(in srgb, var(--income) 8%, var(--surface))",
          }}
        >
          <div
            className="dashboard-action-icon"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "color-mix(in srgb, var(--income) 15%, transparent)",
              color: "var(--income)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowUpRight size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <p className="dashboard-action-title" style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Lend Money
            </p>
            <p className="dashboard-action-subtitle" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              I gave to friend
            </p>
          </div>
        </Link>

        <Link
          href="/ledger/new?direction=I_BORROWED"
          className="card card-interactive dashboard-action-item"
          style={{
            border: "1px solid color-mix(in srgb, var(--expense) 30%, transparent)",
            background: "color-mix(in srgb, var(--expense) 8%, var(--surface))",
          }}
        >
          <div
            className="dashboard-action-icon"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "color-mix(in srgb, var(--expense) 15%, transparent)",
              color: "var(--expense)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowDownLeft size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <p className="dashboard-action-title" style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Borrow Money
            </p>
            <p className="dashboard-action-subtitle" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              I borrowed
            </p>
          </div>
        </Link>

        <Link
          href="/budget"
          className="card card-interactive dashboard-action-item"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            className="dashboard-action-icon"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "color-mix(in srgb, var(--primary) 15%, transparent)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Plus size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <p className="dashboard-action-title" style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Add Expense
            </p>
            <p className="dashboard-action-subtitle" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Daily budget log
            </p>
          </div>
        </Link>

        <Link
          href="/friends"
          className="card card-interactive dashboard-action-item"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            className="dashboard-action-icon"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <p className="dashboard-action-title" style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Friends
            </p>
            <p className="dashboard-action-subtitle" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              View all friends
            </p>
          </div>
        </Link>
      </div>

      {/* ── Key Metrics Cards ─────────────────────────────────────── */}
      <div className="dashboard-metrics-grid">
        <div className="card dashboard-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.375rem" }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Net Balance
              </p>
              <p
                className="money dashboard-metric-value"
                style={{
                  color: (data?.budget.balance ?? 0) >= 0 ? "var(--income)" : "var(--expense)",
                }}
              >
                {fmt(data?.budget.balance ?? 0)}
              </p>
            </div>
            <div
              className="dashboard-metric-icon"
              style={{
                background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                color: "var(--primary)",
              }}
            >
              <Wallet size={18} />
            </div>
          </div>
        </div>

        <div className="card dashboard-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.375rem" }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Total Income
              </p>
              <p className="money dashboard-metric-value" style={{ color: "var(--income)" }}>
                +{fmt(data?.budget.totalIncome ?? 0)}
              </p>
            </div>
            <div
              className="dashboard-metric-icon"
              style={{
                background: "color-mix(in srgb, var(--income) 15%, transparent)",
                color: "var(--income)",
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        <div className="card dashboard-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.375rem" }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Total Expense
              </p>
              <p className="money dashboard-metric-value" style={{ color: "var(--expense)" }}>
                -{fmt(data?.budget.totalExpense ?? 0)}
              </p>
            </div>
            <div
              className="dashboard-metric-icon"
              style={{
                background: "color-mix(in srgb, var(--expense) 15%, transparent)",
                color: "var(--expense)",
              }}
            >
              <TrendingDown size={18} />
            </div>
          </div>
        </div>

        <div className="card dashboard-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.375rem" }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Net Friend Ledger
              </p>
              <p
                className="money dashboard-metric-value"
                style={{
                  color: netFriendBalance >= 0 ? "var(--income)" : "var(--expense)",
                }}
              >
                {fmt(netFriendBalance)}
              </p>
            </div>
            <div
              className="dashboard-metric-icon"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
              }}
            >
              <Coins size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Friends Lend / Borrow Summary Strips ─────────────────── */}
      <div className="dashboard-summary-strips-grid">
        <div
          className="card dashboard-summary-strip"
          style={{
            borderLeft: "5px solid var(--income)",
            background: "color-mix(in srgb, var(--income) 5%, var(--surface))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ color: "var(--income)", fontWeight: 600, fontSize: "0.85rem", margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <ArrowUpRight size={16} /> Friends Owe You
              </p>
              <p className="money" style={{ fontSize: "clamp(1.2rem, 4.5vw, 1.75rem)", fontWeight: 700, color: "var(--income)", margin: "0.25rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fmt(data?.friends.totalOwedToMe ?? 0)}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {data?.friends.friendsOwingMe ?? 0} friend{data?.friends.friendsOwingMe !== 1 ? "s" : ""} pending
              </p>
            </div>
            <Link href="/friends" className="btn btn-sm btn-ghost" style={{ background: "var(--surface)", flexShrink: 0 }}>
              View →
            </Link>
          </div>
        </div>

        <div
          className="card dashboard-summary-strip"
          style={{
            borderLeft: "5px solid var(--expense)",
            background: "color-mix(in srgb, var(--expense) 5%, var(--surface))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ color: "var(--expense)", fontWeight: 600, fontSize: "0.85rem", margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <ArrowDownLeft size={16} /> You Owe Friends
              </p>
              <p className="money" style={{ fontSize: "clamp(1.2rem, 4.5vw, 1.75rem)", fontWeight: 700, color: "var(--expense)", margin: "0.25rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fmt(data?.friends.totalIOwe ?? 0)}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {data?.friends.friendsIowe ?? 0} friend{data?.friends.friendsIowe !== 1 ? "s" : ""} pending
              </p>
            </div>
            <Link href="/friends" className="btn btn-sm btn-ghost" style={{ background: "var(--surface)", flexShrink: 0 }}>
              View →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Two-Column Main Content ─────────────────────────────────── */}
      <div className="dashboard-main-grid">
        {/* Left Column: Pending Friend Balances */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Overdue Alerts if any */}
          {(data?.overdue?.length ?? 0) > 0 && (
            <div
              className="card"
              style={{
                borderLeft: "4px solid var(--expense)",
                background: "color-mix(in srgb, var(--expense) 8%, var(--surface))",
                padding: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem", color: "var(--expense)" }}>
                Overdue Reminders ({data?.overdue.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data?.overdue.map((o) => (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{o.friendName}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
                        Due: {formatDate(o.dueDate, "short")} {o.reason ? `· ${o.reason}` : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="money" style={{ fontWeight: 700, color: "var(--expense)", fontSize: "0.9rem" }}>
                        {fmt(o.amount)}
                      </span>
                      <Link href={`/friends/${o.friendId}`} className="btn btn-sm btn-ghost" style={{ padding: "0.25rem 0.5rem" }}>
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Friends List */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>Pending Friend Balances</h3>
              <Link href="/friends" style={{ fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}>
                All Friends →
              </Link>
            </div>

            {(data?.friends.top5?.length ?? 0) === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--muted)" }}>
                <div style={{ width: "48px", height: "48px", margin: "0 auto 0.5rem", borderRadius: "50%", background: "color-mix(in srgb, var(--income) 15%, transparent)", color: "var(--income)", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={24} /></div>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "var(--text)" }}>All settled up!</p>
                <p style={{ fontSize: "0.8125rem", margin: "0 0 1rem" }}>No friends currently owe you, and you owe no one.</p>
                <Link href="/ledger/new" className="btn btn-sm btn-primary">
                  + Record a Lend / Borrow
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data?.friends.top5.map((f) => {
                  const hue = stringToHue(f.name);
                  const isPositive = f.net > 0;
                  return (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: `hsl(${hue}, 55%, 50%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                        }}
                      >
                        {initials(f.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {f.name}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: isPositive ? "var(--income)" : "var(--expense)", margin: 0, fontWeight: 500 }}>
                          {isPositive ? "Owes you" : "You owe"} · {f.lastDate ? formatDate(f.lastDate, "short") : "Recent"}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="money" style={{ fontWeight: 700, color: isPositive ? "var(--income)" : "var(--expense)", margin: 0, fontSize: "0.95rem" }}>
                          {fmt(Math.abs(f.net))}
                        </p>
                      </div>
                      <Link href={`/friends/${f.id}`} className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }}>
                        Open
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity & Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Recent Money Activity (Budget & Friends) */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>Recent Money Activity</h3>
              <Link href="/budget" style={{ fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}>
                Budget Sheet →
              </Link>
            </div>

            {((data?.recentLedger?.length ?? 0) === 0 && (data?.recentActivity?.length ?? 0) === 0) ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--muted)" }}>
                <div style={{ width: "48px", height: "48px", margin: "0 auto 0.5rem", borderRadius: "50%", background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={24} /></div>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "var(--text)" }}>No recent activity</p>
                <p style={{ fontSize: "0.8125rem", margin: "0 0 1rem" }}>Start logging your daily expenses or friend transactions.</p>
                <Link href="/budget" className="btn btn-sm btn-primary">
                  + Add Expense
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {/* Recent Ledger items */}
                {data?.recentLedger?.map((l) => {
                  const meta = DIRECTION_LABELS[l.direction] ?? { label: l.direction, color: "var(--text)", sign: "" };
                  return (
                    <div
                      key={l.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--border)",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <Coins size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                          <p style={{ fontWeight: 500, fontSize: "0.85rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {meta.label} ({l.friendName})
                          </p>
                          <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {formatDate(l.date, "short")} {l.reason ? `· ${l.reason}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="money" style={{ fontWeight: 600, color: meta.color, fontSize: "0.85rem", flexShrink: 0, marginLeft: "0.5rem" }}>
                        {meta.sign}{fmt(l.amount)}
                      </span>
                    </div>
                  );
                })}

                {/* Recent Budget entries */}
                {data?.recentActivity?.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--border)",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1, overflow: "hidden" }}>
                      {b.entryType === "INCOME" ? <TrendingUp size={16} style={{ color: "var(--income)", flexShrink: 0 }} /> : <TrendingDown size={16} style={{ color: "var(--expense)", flexShrink: 0 }} />}
                      <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <p style={{ fontWeight: 500, fontSize: "0.85rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</p>
                        <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {formatDate(b.date, "short")} {b.category ? `· ${b.category}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className="money"
                      style={{
                        fontWeight: 600,
                        color: b.entryType === "INCOME" ? "var(--income)" : "var(--expense)",
                        fontSize: "0.85rem",
                        flexShrink: 0,
                        marginLeft: "0.5rem",
                      }}
                    >
                      {b.entryType === "INCOME" ? "+" : "-"}{fmt(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Breakdown / Category Chart */}
          <div className="card" style={{ minWidth: 0, overflow: "hidden" }}>
            <h3 style={{ fontSize: "1rem", margin: "0 0 1rem" }}>Expense by Category</h3>
            {(data?.categoryBreakdown?.length ?? 0) > 0 ? (
              <div style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", height: 180, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data?.categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {data?.categoryBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v) || 0)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.75rem" }}>
                  {data?.categoryBreakdown.slice(0, 6).map((c) => (
                    <div
                      key={c.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        fontSize: "0.75rem",
                        background: "var(--surface-2)",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: c.color }} />
                      <span>{c.icon}</span>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                      <span style={{ color: "var(--muted)" }}>({fmt(c.amount)})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--muted)" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>No category expenses logged for this month.</p>
                <Link href="/budget" className="btn btn-sm btn-ghost" style={{ border: "1px solid var(--border)" }}>
                  + Add Expense
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
