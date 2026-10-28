import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PocketLedger — Smart Budget & Friend Money Tracker",
  description:
    "Track daily expenses, manage money you lend/borrow from friends, and send reminders — all in one beautiful app.",
};

const features = [
  {
    icon: "📊",
    title: "Excel-style Budget Sheet",
    desc: "Track income & expenses in a familiar spreadsheet interface with categories, filters, and instant totals.",
  },
  {
    icon: "👥",
    title: "Friends Money Ledger",
    desc: "Record every lend and borrow. See who owes you and how much, with a complete transaction history.",
  },
  {
    icon: "💬",
    title: "Send Reminders",
    desc: "Send polite money reminders via WhatsApp or Email with one tap — never feel awkward asking again.",
  },
  {
    icon: "📈",
    title: "Reports & Charts",
    desc: "Visual spending breakdown by category, daily trends, and exportable PDF/Excel reports.",
  },
  {
    icon: "🌙",
    title: "Dark Mode",
    desc: "Beautiful Emerald Night theme. Easy on the eyes day or night.",
  },
  {
    icon: "📱",
    title: "Mobile-first PWA",
    desc: "Works perfectly on your phone. Install it on your home screen for instant access.",
  },
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>💰</span>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "var(--primary)",
            }}
          >
            PocketLedger
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/auth/login" className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          textAlign: "center",
          padding: "6rem 1.5rem 4rem",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 100%)",
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            padding: "0.35rem 1rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--primary)",
            marginBottom: "1.5rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          ✨ Smart budget tracker for boarding-house life
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 6vw, 3.75rem)",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: "700px",
            margin: "0 auto 1.25rem",
          }}
        >
          Never forget{" "}
          <span style={{ color: "var(--primary)" }}>who owes whom</span>{" "}
          again.
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--muted)",
            maxWidth: "520px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}
        >
          PocketLedger helps you manage your daily budget and track every rupee
          you lend to or borrow from friends — with beautiful charts and
          one-tap reminders.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/auth/signup"
            className="btn btn-primary btn-lg"
            style={{ minWidth: "180px" }}
          >
            Start for free →
          </Link>
          <Link
            href="/auth/login"
            className="btn btn-ghost btn-lg"
            style={{ minWidth: "180px" }}
          >
            Log in
          </Link>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "3rem",
          padding: "2rem 2rem",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        {[
          { label: "Monthly budgets tracked", value: "∞" },
          { label: "Friends ledger entries", value: "∞" },
          { label: "Reminders sent", value: "WhatsApp + Email" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "1.5rem",
                color: "var(--primary)",
                margin: 0,
              }}
            >
              {s.value}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "0.75rem" }}>Everything you need</h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            marginBottom: "3rem",
            maxWidth: "480px",
            margin: "0 auto 3rem",
          }}
        >
          From daily coffee expenses to tracking a friend's Rs. 5,000 debt.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>{f.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section
        style={{
          margin: "0 1.5rem 4rem",
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
          borderRadius: "var(--radius-lg)",
          padding: "3rem 2rem",
          textAlign: "center",
          color: "#fff",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h2 style={{ color: "#fff", marginBottom: "0.75rem" }}>
          Start tracking in 30 seconds
        </h2>
        <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "2rem" }}>
          Free forever. No credit card required.
        </p>
        <Link
          href="/auth/signup"
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "#10231d",
            padding: "0.875rem 2.5rem",
            borderRadius: "var(--radius-sm)",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
            transition: "all 200ms ease",
          }}
        >
          Create free account →
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--muted)",
          fontSize: "0.875rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p>© 2026 PocketLedger · Built with 💚 for boarding-house life</p>
      </footer>
    </main>
  );
}
