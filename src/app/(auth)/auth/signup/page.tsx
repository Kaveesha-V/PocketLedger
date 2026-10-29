"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

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

// ─── OTP Input ────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  }

  function handleChange(i: number, v: string) {
    const char = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? char : d)).join("");
    onChange(next);
    if (char && i < 5) {
      refs[i + 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6).split("").join(""));
    onChange(pasted);
    refs[Math.min(pasted.length, 5)].current?.focus();
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", margin: "1.5rem 0" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onPaste={handlePaste}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          style={{
            width: "3rem",
            height: "3.5rem",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            fontFamily: "Poppins, monospace",
            border: `2px solid ${d ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            color: "var(--fg)",
            outline: "none",
            transition: "border-color 150ms",
          }}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Registration Form ────────────────
function StepForm({
  form,
  onChange,
  onNext,
  error,
  loading,
}: {
  form: Record<string, string>;
  onChange: (k: string, v: string) => void;
  onNext: () => void;
  error: string;
  loading: boolean;
}) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
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

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>

      {error && (
        <div
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
            id="name" className="input" type="text" placeholder="Kasun Perera"
            required value={form.name} onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email" className="input" type="email" placeholder="kasun@example.com"
            required value={form.email} onChange={(e) => onChange("email", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">
            WhatsApp number{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="phone" className="input" type="tel" placeholder="+94771234567"
            value={form.phone} onChange={(e) => onChange("phone", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="currency">Preferred currency</label>
          <select
            id="currency" className="input" value={form.currency}
            onChange={(e) => onChange("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password" className="input" type="password" placeholder="Min. 8 characters"
            required value={form.password} onChange={(e) => onChange("password", e.target.value)}
          />
          <PasswordStrength password={form.password} />
        </div>

        <div className="field">
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword" className="input" type="password" placeholder="Repeat your password"
            required value={form.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
          />
        </div>

        <button
          id="btn-signup-submit" type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "0.5rem" }}
          disabled={loading}
        >
          {loading ? "Sending verification…" : "Continue →"}
        </button>
      </form>

      <p style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", marginTop: "1.25rem" }}>
        By signing up you agree to our terms. Reminders are only sent when you press send.
      </p>
    </>
  );
}

// ─── Step 2: OTP Verification ────────────────
function StepOtp({
  email,
  onVerified,
  onBack,
  devOtp,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  devOtp?: string;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        onVerified();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendCooldown(60);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError("Could not resend code. Please try again.");
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📧</div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Check your email</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          We sent a 6-digit verification code to
          <br />
          <strong style={{ color: "var(--fg)" }}>{email}</strong>
        </p>
      </div>

      {/* Dev mode hint */}
      {devOtp && (
        <div style={{
          padding: "0.625rem 1rem",
          borderRadius: "var(--radius-sm)",
          marginBottom: "1rem",
          fontSize: "0.8rem",
          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
          color: "var(--primary)",
          textAlign: "center",
        }}>
          🛠 Dev mode — OTP: <strong style={{ letterSpacing: "0.2em" }}>{devOtp}</strong>
        </div>
      )}

      {error && (
        <div style={{
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-sm)",
          marginBottom: "1rem",
          fontSize: "0.875rem",
          background: "color-mix(in srgb, var(--expense) 12%, transparent)",
          color: "var(--expense)",
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <OtpInput value={otp} onChange={setOtp} />

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={loading || otp.length < 6}
        >
          {loading ? "Verifying…" : "Verify email →"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
        {resendCooldown > 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Resend code in {resendCooldown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--primary)", fontSize: "0.875rem", textDecoration: "underline",
            }}
          >
            Resend code
          </button>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted)", fontSize: "0.8rem",
          }}
        >
          ← Change email
        </button>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp" | "creating">("form");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "", currency: "LKR",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Step 1 → send OTP and move to step 2
  async function handleFormSubmit() {
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("Password must contain at least one number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return;
      }

      // In dev mode the API returns the OTP so we can show it
      if (json.data?.devOtp) {
        setDevOtp(json.data.devOtp);
      }

      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 → OTP verified, create account
  async function handleOtpVerified() {
    setStep("creating");
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, otpVerified: true }),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setStep("form");
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
      setStep("form");
    }
  }

  if (step === "creating") {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
        <h2 style={{ fontSize: "1.25rem" }}>Creating your account…</h2>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          Just a moment, we're setting everything up.
        </p>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <StepOtp
        email={form.email}
        devOtp={devOtp}
        onVerified={handleOtpVerified}
        onBack={() => { setStep("form"); setError(""); }}
      />
    );
  }

  return (
    <StepForm
      form={form}
      onChange={set}
      onNext={handleFormSubmit}
      error={error}
      loading={loading}
    />
  );
}
