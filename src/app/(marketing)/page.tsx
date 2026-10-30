import Link from "next/link";
import type { Metadata } from "next";
import {
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  Moon,
  Smartphone,
  Wallet,
  Sparkles,
  Heart,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PocketLedger — Smart Budget & Friend Money Tracker",
  description:
    "Track daily expenses, manage money you lend/borrow from friends, and send reminders — all in one beautiful app.",
};

const features = [
  {
    icon: BarChart3,
    title: "Excel-style Budget Sheet",
    desc: "Track income & expenses in a familiar spreadsheet interface with categories, filters, and instant totals.",
  },
  {
    icon: Users,
    title: "Friends Money Ledger",
    desc: "Record every lend and borrow. See who owes you and how much, with a complete transaction history.",
  },
  {
    icon: MessageSquare,
    title: "Send Reminders",
    desc: "Send polite money reminders via WhatsApp or Email with one tap — never feel awkward asking again.",
  },
  {
    icon: TrendingUp,
    title: "Reports & Charts",
    desc: "Visual spending breakdown by category, daily trends, and exportable PDF/Excel reports.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    desc: "Beautiful Emerald Night theme. Easy on the eyes day or night.",
  },
  {
    icon: Smartphone,
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Wallet size={18} />
          </span>
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

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/auth/login" className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section
        style={{
          textAlign: "center",
          padding: "5rem 1.5rem 4rem",
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
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
          <Sparkles size={14} /> Smart budget tracker for boarding-house life
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
          Stop losing track of money between friends.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            color: "var(--muted)",
            maxWidth: "560px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.6,
          }}
        >
          Manage your daily boarding expenses and every single rupee you lend or borrow — in one place, with one tap.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/auth/signup"
            className="btn btn-primary btn-lg"
            style={{
              padding: "0.875rem 2rem",
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Start Tracking Free <ArrowRight size={18} />
          </Link>
          <Link
            href="/auth/login"
            className="btn btn-secondary btn-lg"
            style={{ padding: "0.875rem 1.75rem", fontSize: "1rem" }}
          >
            Sign In
          </Link>
        </div>

        {/* Hero image placeholder / Preview card */}
        <div
          className="card animate-slide-up"
          style={{
            marginTop: "3.5rem",
            padding: "2rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#ef4444",
                display: "inline-block",
              }}
            />
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#f59e0b",
                display: "inline-block",
              }}
            />
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.8rem",
                color: "var(--muted)",
              }}
            >
              pocketledger.app/dashboard
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { label: "Net Balance", val: "LKR 12,450.00", color: "var(--income)" },
              { label: "Total Friends Owe You", val: "LKR 4,200.00", color: "var(--income)" },
              { label: "Total You Owe Friends", val: "LKR 1,500.00", color: "var(--expense)" },
              { label: "This Month Spent", val: "LKR 28,100.00", color: "var(--text)" },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: "var(--surface-2)",
                  padding: "1rem",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{k.label}</div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: k.color,
                    marginTop: "0.25rem",
                  }}
                >
                  {k.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "4rem 1.5rem",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Everything you need. Nothing you don't.
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem" }}>
            Built specifically for students and roommates in Sri Lanka and worldwide.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f, i) => {
            const IconComp = f.icon;
            return (
              <div
                key={f.title}
                className="card animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "var(--surface-2)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <IconComp size={22} />
                </div>
                <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>{f.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            );
          })}
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
        <h2 style={{ fontSize: "1.875rem", marginBottom: "0.75rem", color: "#fff" }}>
          Ready to take control of your boarding budget?
        </h2>
        <p
          style={{
            opacity: 0.9,
            marginBottom: "2rem",
            maxWidth: "480px",
            margin: "0 auto 2rem",
          }}
        >
          Free to use. No credit card required. Works directly on your phone and desktop.
        </p>
        <Link
          href="/auth/signup"
          className="btn"
          style={{
            background: "#fff",
            color: "var(--primary-dark)",
            padding: "0.875rem 2.25rem",
            fontWeight: 700,
            fontSize: "1rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          Create free account <ArrowRight size={18} />
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
        <p style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          © 2026 PocketLedger · Built with <Heart size={14} style={{ fill: "var(--primary)", color: "var(--primary)" }} /> for boarding-house life
        </p>
      </footer>
    </main>
  );
}
