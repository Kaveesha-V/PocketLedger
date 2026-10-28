"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import type { Metadata } from "next";

const CURRENCIES = [
  { code: "LKR", label: "LKR — Sri Lankan Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["#e5484d", "#f59e0b", "#0f9d78"];
  const labels = ["Weak", "Fair", "Strong"];

  if (!password) return null;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "0.375rem" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "999px",
              background: i < score ? colors[score - 1] : "var(--border)",
              transition: "background 200ms",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        {checks.map((c) => (
          <span
            key={c.label}
            style={{
              fontSize: "0.75rem",
              color: c.pass ? "var(--income)" : "var(--muted)",
            }}
          >
            {c.pass ? "✓" : "·"} {c.label}
          </span>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: colors[score - 1] || "var(--muted)", marginTop: "0.25rem" }}>
        {password ? labels[score - 1] ?? "Weak" : ""}
      </p>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    currency: "LKR",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return;
      }

      // Auto-sign-in after signup
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.625rem", marginBottom: "0.375rem" }}>Create account</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--primary)", fontWeight: 500 }}>
            Log in
          </Link>
        </p>
      </div>

      {/* Google login */}
      <button
        id="btn-google-signup"
        type="button"
        className="btn btn-ghost"
        style={{ width: "100%", marginBottom: "1.25rem", gap: "0.625rem" }}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>

      {error && (
        <div
          className="badge-expense"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            background: "color-mix(in srgb, var(--expense) 12%, transparent)",
            color: "var(--expense)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            type="text"
            placeholder="Kasun Perera"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="kasun@example.com"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">
            WhatsApp number{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="phone"
            className="input"
            type="tel"
            placeholder="+94771234567"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="currency">Preferred currency</label>
          <select
            id="currency"
            className="input"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Min. 8 characters"
            required
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <PasswordStrength password={form.password} />
        </div>

        <div className="field">
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            className="input"
            type="password"
            placeholder="Repeat your password"
            required
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
          />
        </div>

        <button
          id="btn-signup-submit"
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "0.5rem" }}
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>

      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--muted)",
          textAlign: "center",
          marginTop: "1.25rem",
        }}
      >
        By signing up you agree to our terms. Reminders are only sent when you press send.
      </p>
    </>
  );
}
