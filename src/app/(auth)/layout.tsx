import type { Metadata } from "next";
import { Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "PocketLedger — Authentication",
  description: "Sign in or register for your PocketLedger account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(ellipse at top, color-mix(in srgb, var(--primary) 14%, var(--bg)) 0%, var(--bg) 75%)",
      }}
    >
      {/* Topbar */}
      <header
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)",
            }}
          >
            <Wallet size={19} />
          </span>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            PocketLedger
          </span>
        </a>
      </header>

      {/* Centered card */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem 1rem 2.5rem",
        }}
      >
        <div
          className="card animate-slide-up auth-card"
          style={{
            width: "100%",
            maxWidth: "420px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            borderRadius: "var(--radius-lg, 24px)",
          }}
        >
          {children}
        </div>
      </main>

      <style>{`
        .auth-card {
          padding: 2.5rem 2rem;
        }
        @media (max-width: 640px) {
          .auth-card {
            padding: 1.5rem 1.25rem !important;
            border-radius: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
