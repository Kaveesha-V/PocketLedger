"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface ReportData {
  month: string;
  budget: { totalIncome: number; totalExpense: number; balance: number };
  categoryBreakdown: Array<{ name: string; color: string; icon: string; amount: number }>;
  dailySpending: Array<{ date: string; amount: number }>;
  friends: {
    totalOwedToMe: number;
    totalIOwe: number;
    top5: Array<{ id: string; name: string; net: number }>;
  };
}

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ key, label });
  }
  return options;
}

export default function ReportsPage() {
  const currency = "LKR";
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/summary?month=${month}`)
      .then((r) => r.json())
      .then((j) => { if (j.data) setData(j.data); })
      .finally(() => setLoading(false));
  }, [month]);

  const fmt = (n: number) => formatCurrency(n, currency);

  async function exportPDF() {
    if (!data) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 157, 120); // #0f9d78 Emerald
      doc.text("PocketLedger Report", 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(107, 127, 119); // Muted
      doc.text(`Month: ${month}  |  Generated on ${new Date().toLocaleDateString()}`, 14, 28);

      doc.setDrawColor(216, 230, 224);
      doc.line(14, 32, 196, 32);

      // Financial Summary
      doc.setFontSize(14);
      doc.setTextColor(16, 35, 29);
      doc.text("Monthly Financial Summary", 14, 42);

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`• Total Income: ${fmt(data.budget.totalIncome)}`, 18, 52);
      doc.text(`• Total Expense: ${fmt(data.budget.totalExpense)}`, 18, 60);
      doc.text(`• Net Month Balance: ${fmt(data.budget.balance)}`, 18, 68);
      doc.text(`• Total Friends Owe You: ${fmt(data.friends.totalOwedToMe)}`, 18, 76);
      doc.text(`• Total You Owe Friends: ${fmt(data.friends.totalIOwe)}`, 18, 84);

      // Category breakdown
      doc.setFontSize(14);
      doc.setTextColor(16, 35, 29);
      doc.text("Expense by Category", 14, 100);

      let y = 110;
      doc.setFontSize(10);
      data.categoryBreakdown.forEach((cat) => {
        if (y < 270) {
          doc.text(`• ${cat.name}: ${fmt(cat.amount)}`, 18, y);
          y += 8;
        }
      });

      // Top Friends Balances
      if (y > 230) {
        doc.addPage();
        y = 20;
      } else {
        y += 10;
      }
      doc.setFontSize(14);
      doc.setTextColor(16, 35, 29);
      doc.text("Friends Ledger Snapshot", 14, y);
      y += 10;

      doc.setFontSize(10);
      if (data.friends.top5.length === 0) {
        doc.text("No pending friend balances.", 18, y);
      } else {
        data.friends.top5.forEach((f) => {
          const status = f.net > 0 ? `Owes you ${fmt(f.net)}` : `You owe ${fmt(Math.abs(f.net))}`;
          doc.text(`• ${f.name}: ${status}`, 18, y);
          y += 8;
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("PocketLedger — Smart Budget & Friend Money Tracker", 14, 285);

      doc.save(`PocketLedger_Report_${month}.pdf`);
      setExportNotice("PDF report downloaded ✓");
      setTimeout(() => setExportNotice(""), 3000);
    } catch {
      setExportNotice("⚠️ Error generating PDF. Please try again.");
    }
  }

  // Income vs Expense bar data
  const incomeExpenseData = [
    { name: "Income", value: data?.budget.totalIncome ?? 0, fill: "#16a34a" },
    { name: "Expense", value: data?.budget.totalExpense ?? 0, fill: "#e5484d" },
    { name: "Balance", value: data?.budget.balance ?? 0, fill: "#0f9d78" },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <h1>Reports</h1>
        <select className="input" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(e.target.value)}>
          {getMonthOptions().map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "300px" }} />)}
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Income", value: fmt(data?.budget.totalIncome ?? 0), color: "var(--income)" },
              { label: "Total Expense", value: fmt(data?.budget.totalExpense ?? 0), color: "var(--expense)" },
              { label: "Net Balance", value: fmt(data?.budget.balance ?? 0), color: (data?.budget.balance ?? 0) >= 0 ? "var(--income)" : "var(--expense)" },
              { label: "Friends owe me", value: fmt(data?.friends.totalOwedToMe ?? 0), color: "var(--income)" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ flex: "1 1 180px", textAlign: "center" }}>
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0 0 0.375rem" }}>{s.label}</p>
                <p className="money" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "1.375rem", color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* Income vs Expense */}
            <div className="card">
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Income vs Expense</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <Tooltip formatter={(v: any) => fmt(Number(v) || 0)} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {incomeExpenseData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category donut */}
            <div className="card">
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Expense by Category</h3>
              {(data?.categoryBreakdown?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={data?.categoryBreakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={2}>
                      {data?.categoryBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(Number(v) || 0)} />
                    <Legend formatter={(v) => <span style={{ fontSize: "0.75rem", color: "var(--text)" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p style={{ color: "var(--muted)", textAlign: "center", padding: "4rem" }}>No data</p>}
            </div>

            {/* Daily spending */}
            <div className="card">
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Daily Spending</h3>
              {(data?.dailySpending?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data?.dailySpending} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted)" }} tickFormatter={(v) => String(v || "").slice(8)} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted)" }} />
                    <Tooltip formatter={(v: any) => fmt(Number(v) || 0)} labelFormatter={(l: any) => `Day ${String(l || "").slice(8)}`} />
                    <Bar dataKey="amount" fill="var(--expense)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p style={{ color: "var(--muted)", textAlign: "center", padding: "4rem" }}>No data</p>}
            </div>

            {/* Friends summary */}
            <div className="card">
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Friends Ledger Summary</h3>
              {(data?.friends.top5?.length ?? 0) > 0 ? (
                <div>
                  {data?.friends.top5.map((f) => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontWeight: 500 }}>{f.name}</span>
                      <span className="money" style={{ fontWeight: 700, color: f.net > 0 ? "var(--income)" : "var(--expense)" }}>
                        {f.net > 0 ? "+" : ""}{fmt(f.net)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>No friends data</p>}
            </div>
          </div>

          {/* Export buttons */}
          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={exportPDF}
            >
              📄 Export PDF
            </button>
            <a
              href={`/api/budget/export?month=${month}&format=xlsx`}
              download
              className="btn btn-ghost btn-sm"
              style={{ textDecoration: "none" }}
            >
              📊 Export Excel
            </a>
            <a
              href={`/api/budget/export?month=${month}&format=csv`}
              download
              className="btn btn-ghost btn-sm"
              style={{ textDecoration: "none" }}
            >
              📋 Export CSV
            </a>
            {exportNotice && (
              <span style={{ fontSize: "0.85rem", color: exportNotice.startsWith("⚠️") ? "var(--expense)" : "var(--income)", fontWeight: 500 }}>
                {exportNotice}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
