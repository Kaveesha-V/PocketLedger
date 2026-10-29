"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DEFAULT_TEMPLATES, ReminderTemplates } from "@/lib/messages";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  currency: string;
  theme: string;
  reminderTemplates: ReminderTemplates;
}

const CURRENCIES = [
  { code: "LKR", label: "LKR (Rs) — Sri Lankan Rupee" },
  { code: "USD", label: "USD ($) — US Dollar" },
  { code: "INR", label: "INR (₹) — Indian Rupee" },
  { code: "EUR", label: "EUR (€) — Euro" },
  { code: "GBP", label: "GBP (£) — British Pound" },
  { code: "SGD", label: "SGD ($) — Singapore Dollar" },
  { code: "AED", label: "AED (د.إ) — UAE Dirham" },
  { code: "AUD", label: "AUD ($) — Australian Dollar" },
  { code: "CAD", label: "CAD ($) — Canadian Dollar" },
];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    currency: "LKR",
    theme: "light",
    reminderTemplates: DEFAULT_TEMPLATES,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/user/settings");
      const json = await res.json();
      if (json.data) {
        const currentTheme = json.data.theme || localStorage.getItem("pl_theme") || "light";
        setProfile({
          name: json.data.name || "",
          email: json.data.email || "",
          phone: json.data.phone || "",
          currency: json.data.currency || "LKR",
          theme: currentTheme,
          reminderTemplates: json.data.reminderTemplates || DEFAULT_TEMPLATES,
        });
        if (currentTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // Fallback from session if route not ready
      if (session?.user) {
        setProfile((prev) => ({
          ...prev,
          name: session.user?.name || "",
          email: session.user?.email || "",
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleThemeChange(newTheme: string) {
    setProfile((prev) => ({ ...prev, theme: newTheme }));
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("pl_theme", newTheme);
  }

  async function saveProfile() {
    setSavingProfile(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          currency: profile.currency,
          theme: profile.theme,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update profile");
      } else {
        setSuccessMsg("Profile and preferences updated successfully!");
        if (updateSession) updateSession();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  }

  async function saveTemplates() {
    setSavingTemplates(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderTemplates: profile.reminderTemplates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update templates");
      } else {
        setSuccessMsg("Reminder templates saved!");
      }
    } catch {
      setErrorMsg("Network error saving templates.");
    } finally {
      setSavingTemplates(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordErr("");

    if (newPassword.length < 8) {
      setPasswordErr("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordErr(data.error || "Failed to change password");
      } else {
        setPasswordMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordErr("Network error while changing password.");
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordMsg(""), 4000);
    }
  }

  async function exportData() {
    try {
      const res = await fetch("/api/user/settings?action=export");
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PocketLedger_Export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setExportNotice("Export downloaded successfully ✓");
      setTimeout(() => setExportNotice(""), 3000);
    } catch {
      setExportNotice("⚠️ Failed to export user data. Please try again.");
    }
  }

  async function deleteAccount() {
    if (deleteInput !== "DELETE") {
      setDeleteError("Please type DELETE to confirm account deletion.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/user/settings", {
        method: "DELETE",
      });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        const d = await res.json();
        setDeleteError(d.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("Network error deleting account");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "1.5rem 2rem", maxWidth: "800px" }}>
        <h1 style={{ marginBottom: "1.5rem" }}>Settings</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "160px", borderRadius: "12px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "800px", paddingBottom: "5rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Settings & Preferences</h1>

      {successMsg && (
        <div
          style={{
            padding: "0.875rem 1.25rem",
            background: "rgba(22, 163, 74, 0.12)",
            color: "var(--income)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.25rem",
            fontWeight: 500,
            border: "1px solid rgba(22, 163, 74, 0.3)",
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: "0.875rem 1.25rem",
            background: "rgba(229, 72, 77, 0.12)",
            color: "var(--expense)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.25rem",
            fontWeight: 500,
            border: "1px solid rgba(229, 72, 77, 0.3)",
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── 1. Profile & Preferences ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>👤 Profile & Preferences</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Email Address (Read-only)</label>
            <input
              type="email"
              className="input"
              value={profile.email}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label className="label">WhatsApp Number (with country code)</label>
            <input
              type="text"
              className="input"
              placeholder="+94771234567"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Primary Currency</label>
            <select
              className="input"
              value={profile.currency}
              onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label className="label">Theme Mode</label>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.35rem" }}>
            <button
              type="button"
              className={`btn btn-sm ${profile.theme === "light" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => handleThemeChange("light")}
            >
              ☀️ Emerald Light
            </button>
            <button
              type="button"
              className={`btn btn-sm ${profile.theme === "dark" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => handleThemeChange("dark")}
            >
              🌙 Emerald Night (Dark)
            </button>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* ── 2. Reminder Message Templates ───────────────────────────── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>💬 Reminder Templates</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setProfile((p) => ({ ...p, reminderTemplates: DEFAULT_TEMPLATES }))}
          >
            Reset to Defaults
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Variables available: <code>{"{friend}"}</code>, <code>{"{currency}"}</code>, <code>{"{amount}"}</code>, <code>{"{count}"}</code>, <code>{"{lastDate}"}</code>, <code>{"{date}"}</code>, <code>{"{myName}"}</code>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label className="label" style={{ fontWeight: 600, color: "var(--income)" }}>
              Template: Friend Owes Me
            </label>
            <textarea
              className="input"
              rows={4}
              style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
              value={profile.reminderTemplates.theyOweMe}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  reminderTemplates: { ...profile.reminderTemplates, theyOweMe: e.target.value },
                })
              }
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, color: "var(--expense)" }}>
              Template: I Owe Friend
            </label>
            <textarea
              className="input"
              rows={4}
              style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
              value={profile.reminderTemplates.iOweThem}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  reminderTemplates: { ...profile.reminderTemplates, iOweThem: e.target.value },
                })
              }
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, color: "var(--primary)" }}>
              Template: All Settled
            </label>
            <textarea
              className="input"
              rows={3}
              style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
              value={profile.reminderTemplates.settled}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  reminderTemplates: { ...profile.reminderTemplates, settled: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveTemplates}
            disabled={savingTemplates}
          >
            {savingTemplates ? "Saving..." : "Save Templates"}
          </button>
        </div>
      </div>

      {/* ── 3. Change Password ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>🔒 Security & Password</h2>

        {passwordMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(22, 163, 74, 0.12)",
              color: "var(--income)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
              fontWeight: 500,
            }}
          >
            ✓ {passwordMsg}
          </div>
        )}

        {passwordErr && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(229, 72, 77, 0.12)",
              color: "var(--expense)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
              fontWeight: 500,
            }}
          >
            ⚠ {passwordErr}
          </div>
        )}

        <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="label">New Password (min 8 chars)</label>
              <input
                type="password"
                className="input"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-secondary" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* ── 4. Data Export & Privacy ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>📦 Your Data & Privacy</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Download a complete copy of all your PocketLedger data including your budget entries, categories, friends, transactions, and reminders in structured JSON format.
        </p>

        <button type="button" className="btn btn-ghost" onClick={exportData}>
          📥 Export All My Data (JSON)
        </button>
        {exportNotice && (
          <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: exportNotice.startsWith("⚠️") ? "var(--expense)" : "var(--income)" }}>
            {exportNotice}
          </p>
        )}
      </div>

      {/* ── 5. Danger Zone ───────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          border: "1px solid rgba(229, 72, 77, 0.4)",
          background: "rgba(229, 72, 77, 0.03)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", color: "var(--expense)", marginBottom: "0.5rem" }}>
          ⚠️ Danger Zone
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Permanently delete your PocketLedger account and all associated data. This action is irreversible.
        </p>

        {!deleteConfirmOpen ? (
          <button
            type="button"
            className="btn"
            style={{
              background: "var(--expense)",
              color: "#ffffff",
              border: "none",
            }}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete Account
          </button>
        ) : (
          <div
            style={{
              padding: "1rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--expense)", marginBottom: "0.5rem" }}>
              Are you absolutely sure?
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
              Please type <strong style={{ color: "var(--text)" }}>DELETE</strong> below to confirm.
            </p>
            {deleteError && (
              <p style={{ fontSize: "0.85rem", color: "var(--expense)", marginBottom: "0.75rem" }}>
                ⚠️ {deleteError}
              </p>
            )}
            <input
              type="text"
              className="input"
              style={{ maxWidth: "240px", marginBottom: "0.75rem" }}
              placeholder="Type DELETE"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn"
                style={{ background: "var(--expense)", color: "#fff", border: "none" }}
                disabled={deleteInput !== "DELETE" || deleting}
                onClick={deleteAccount}
              >
                {deleting ? "Deleting..." : "Permanently Delete Everything"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteInput("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
