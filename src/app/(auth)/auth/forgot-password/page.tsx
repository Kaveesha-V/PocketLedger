"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: implement password reset email via Resend
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(139, 92, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <Mail size={32} />
          </div>
        </div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Check your email</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          If an account exists for <strong>{email}</strong>, you'll receive a reset link
          shortly.
        </p>
        <Link href="/auth/login" className="btn btn-primary" style={{ display: "inline-block" }}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.625rem", marginBottom: "0.375rem" }}>Reset password</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          id="btn-forgot-submit"
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
        <Link href="/auth/login" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          ← Back to login
        </Link>
      </div>
    </>
  );
}
