import type { Metadata } from "next";
import { Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign Up — PocketLedger",
  description: "Create your free PocketLedger account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--bg)) 0%, var(--bg) 60%)",
      }}
    >
      {/* Topbar */}
      <header
        style={{
          padding: "1.25rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
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
              fontSize: "1.125rem",
              color: "var(--primary)",
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
          padding: "2rem 1rem",
        }}
      >
        <div
          className="card animate-slide-up"
          style={{ width: "100%", maxWidth: "440px", padding: "2.5rem" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
