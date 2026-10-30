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
  Heart,
  ArrowRight,
  ShieldCheck,
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
    desc: "Beautiful Velvet Dark theme. Easy on the eyes day or night.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first PWA",
    desc: "Works perfectly on your phone. Install it on your home screen for instant standalone access.",
  },
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav
        className="landing-nav"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 10px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Wallet size={18} />
          </span>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}
          >
            PocketLedger
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link href="/auth/login" className="btn btn-ghost btn-sm" style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem" }}>
            Log in
          </Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm" style={{ padding: "0.45rem 0.875rem", fontSize: "0.875rem", borderRadius: "9999px" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            padding: "0.35rem 0.95rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--primary)",
            marginBottom: "1.25rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <ShieldCheck size={15} style={{ color: "var(--primary)" }} /> Smart budget tracker for boarding-house life
        </div>

        <h1
          style={{
            fontSize: "clamp(1.85rem, 5.5vw, 3.5rem)",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            lineHeight: 1.18,
            maxWidth: "700px",
            margin: "0 auto 1rem",
            color: "var(--text)",
          }}
        >
          Stop losing track of money between friends.
        </h1>

        <p
          style={{
            fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
            color: "var(--muted)",
            maxWidth: "560px",
            margin: "0 auto 2rem",
            lineHeight: 1.6,
          }}
        >
          Manage your daily boarding expenses and every single rupee you lend or borrow — in one place, with one tap.
        </p>

        <div className="landing-hero-actions">
          <Link
            href="/auth/signup"
            className="btn btn-primary btn-lg landing-hero-btn"
          >
            Start Tracking Free <ArrowRight size={18} />
          </Link>
          <div style={{ marginTop: "0.75rem" }}>
            <Link
              href="/auth/login"
              style={{
                color: "var(--muted)",
                fontSize: "0.9rem",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              Already have an account? <span style={{ color: "var(--primary)", fontWeight: 600 }}>Sign In</span>
            </Link>
          </div>
        </div>

        {/* Hero Preview Card */}
        <div className="card animate-slide-up landing-preview-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ marginLeft: "0.5rem", fontSize: "0.78rem", color: "var(--muted)" }}>
              pocketledger.app/dashboard
            </span>
          </div>

          <div className="landing-preview-grid">
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
                  padding: "0.875rem",
                  borderRadius: "var(--radius-sm, 10px)",
                  border: "1px solid var(--border)",
                  minWidth: 0,
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {k.label}
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.95rem, 3.2vw, 1.2rem)",
                    fontWeight: 700,
                    color: k.color,
                    marginTop: "0.25rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
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
      <section className="landing-features">
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", marginBottom: "0.5rem" }}>
            Everything you need. Nothing you don't.
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "clamp(0.9rem, 2vw, 1.05rem)" }}>
            Built specifically for students and roommates in Sri Lanka and worldwide.
          </p>
        </div>

        <div className="landing-features-grid">
          {features.map((f, i) => {
            const IconComp = f.icon;
            return (
              <div
                key={f.title}
                className="card animate-fade-in landing-feature-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "var(--surface-2)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.875rem",
                  }}
                >
                  <IconComp size={20} />
                </div>
                <h3 style={{ marginBottom: "0.4rem", fontSize: "1rem" }}>{f.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="landing-cta-box">
        <h2 style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.875rem)", marginBottom: "0.625rem", color: "#fff" }}>
          Ready to take control of your boarding budget?
        </h2>
        <p
          style={{
            opacity: 0.9,
            marginBottom: "1.75rem",
            maxWidth: "480px",
            margin: "0 auto 1.75rem",
            fontSize: "clamp(0.875rem, 2vw, 1rem)",
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
            padding: "0.875rem 2rem",
            fontWeight: 700,
            fontSize: "1rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            borderRadius: "9999px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
            width: "auto",
            maxWidth: "300px",
          }}
        >
          Create free account <ArrowRight size={18} />
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        style={{
          textAlign: "center",
          padding: "1.75rem 1rem",
          color: "var(--muted)",
          fontSize: "0.8125rem",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}
      >
        <p style={{ display: "inline-flex", alignItems: "center", gap: "4px", margin: 0 }}>
          © 2026 PocketLedger · Built with <Heart size={14} style={{ fill: "var(--primary)", color: "var(--primary)" }} /> for boarding-house life
        </p>
      </footer>

      {/* Responsive Styles for Landing Page */}
      <style>{`
        .landing-nav {
          padding: 1rem 2rem;
        }
        .landing-hero {
          text-align: center;
          padding: 4.5rem 1.5rem 3rem;
          max-width: 860px;
          margin: 0 auto;
          width: 100%;
        }
        .landing-hero-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .landing-hero-btn {
          padding: 0.875rem 2rem;
          font-size: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 9999px;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
        }
        .landing-preview-card {
          margin-top: 3.5rem;
          padding: 2rem;
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          text-align: left;
          border-radius: var(--radius-lg, 24px);
        }
        .landing-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        .landing-features {
          padding: 4rem 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .landing-feature-card {
          padding: 1.5rem;
          border-radius: var(--radius, 16px);
        }
        .landing-cta-box {
          margin: 0 1.5rem 4rem;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: var(--radius-lg, 24px);
          padding: 3rem 2rem;
          textAlign: center;
          color: #fff;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          width: calc(100% - 3rem);
          box-sizing: border-box;
          box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 30%, transparent);
        }

        @media (max-width: 640px) {
          .landing-nav {
            padding: 0.75rem 1rem !important;
          }
          .landing-hero {
            padding: 2.25rem 1rem 1.75rem !important;
          }
          .landing-hero-btn {
            width: 100% !important;
            max-width: 320px !important;
            justify-content: center !important;
            height: 46px !important;
          }
          .landing-preview-card {
            margin-top: 2rem !important;
            padding: 1.125rem 0.875rem !important;
            border-radius: 16px !important;
          }
          .landing-preview-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
          }
          .landing-features {
            padding: 2.5rem 1rem !important;
          }
          .landing-features-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .landing-feature-card {
            padding: 1.125rem 1rem !important;
            border-radius: 14px !important;
          }
          .landing-cta-box {
            padding: 2.25rem 1.25rem !important;
            margin: 0 1rem 3rem !important;
            width: calc(100% - 2rem) !important;
            border-radius: 18px !important;
          }
        }
      `}</style>
    </main>
  );
}
