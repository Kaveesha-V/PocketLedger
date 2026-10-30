"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { AlertCircle, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        router.push(callbackUrl);
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 700, marginBottom: "0.35rem", letterSpacing: "-0.01em" }}>
          Welcome back
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Don't have an account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Create account
          </Link>
        </p>
      </div>

      <button
        id="btn-google-login"
        type="button"
        className="btn btn-ghost"
        style={{
          width: "100%",
          height: "44px",
          borderRadius: "9999px",
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          marginBottom: "0.625rem",
          fontWeight: 600,
          fontSize: "0.9375rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
        onClick={() => signIn("google", { callbackUrl, prompt: "select_account" })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <button
          id="btn-google-switch-account"
          type="button"
          onClick={() => signIn("google", { callbackUrl, prompt: "select_account" })}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "0.78rem",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "0.2rem 0.5rem",
          }}
        >
          Use a different Google account
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm, 10px)",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            background: "color-mix(in srgb, var(--expense) 12%, transparent)",
            color: "var(--expense)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            border: "1px solid color-mix(in srgb, var(--expense) 25%, transparent)",
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="field" style={{ margin: 0 }}>
          <label className="label" htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            Email address
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              required
              style={{
                height: "44px",
                fontSize: "16px",
                paddingLeft: "2.35rem",
                borderRadius: "var(--radius-sm, 10px)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="field" style={{ margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
            <label className="label" htmlFor="password" style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>
              Password
            </label>
            <Link href="/auth/forgot-password" style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Your password"
              required
              style={{
                height: "44px",
                fontSize: "16px",
                paddingLeft: "2.35rem",
                borderRadius: "var(--radius-sm, 10px)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          className="btn btn-primary"
          style={{
            width: "100%",
            height: "44px",
            marginTop: "0.5rem",
            borderRadius: "9999px",
            fontWeight: 600,
            fontSize: "0.95rem",
            boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)",
          }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
