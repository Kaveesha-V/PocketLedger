import type { Metadata } from "next";

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
          <span style={{ fontSize: "1.5rem" }}>💰</span>
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
