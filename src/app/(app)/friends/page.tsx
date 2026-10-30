"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, initials, stringToHue, formatDate } from "@/lib/format";
import { formatDisplayPhone } from "@/lib/messages";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface FriendSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  balance: { net: number; timesGave: number; timesBorrowed: number };
  txCount: number;
  lastActivity: string | null;
}

type Filter = "all" | "owe-me" | "i-owe" | "settled";

function AddFriendModal({ onClose, onAdd }: { onClose: () => void; onAdd: (f: FriendSummary) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      onAdd(json.data);
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card animate-slide-up"
        style={{ width: "100%", maxWidth: "440px", padding: "1.75rem", background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>Add Friend</h2>
        {error && (
          <div
            style={{
              color: "var(--expense)",
              background: "color-mix(in srgb, var(--expense) 10%, transparent)",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label className="label" htmlFor="fname">Full name *</label>
            <input
              id="fname"
              className="input"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Yasith Mavinda"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="femail">
              Email <span style={{ fontWeight: 400, color: "var(--muted)" }}>(for statement reminders)</span>
            </label>
            <input
              id="femail"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="friend@example.com"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="fphone">
              WhatsApp number <span style={{ fontWeight: 400, color: "var(--muted)" }}>(e.g. 0769055019 or +94771234567)</span>
            </label>
            <input
              id="fphone"
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="0769055019"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="fnote">Note <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
            <input
              id="fnote"
              className="input"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Roommate, boarding friend, batchmate…"
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button id="btn-add-friend" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Adding…" : "Add Friend"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FriendSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const currency = "LKR";

  function loadFriends() {
    setLoading(true);
    fetch("/api/friends")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setFriends(j.data);
      })
      .catch((err) => console.error("Failed to load friends", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFriends();
  }, []);

  async function handleDeleteFriend() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/friends/${deleteTarget.id}`, { method: "DELETE" });
      setFriends((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filtered = friends.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "owe-me" && f.balance.net <= 0.01) return false;
    if (filter === "i-owe" && f.balance.net >= -0.01) return false;
    if (filter === "settled" && Math.abs(f.balance.net) > 0.01) return false;
    return true;
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "owe-me", label: "🟢 They owe me" },
    { id: "i-owe", label: "🔴 I owe them" },
    { id: "settled", label: "✅ Settled" },
  ];

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Friends & Ledger</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            Track money lent, borrowed, and net balances with each friend
          </p>
        </div>
        <button id="btn-open-add-friend" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Friend
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: "1 1 200px", maxWidth: "280px" }}
          placeholder="🔍 Search friends…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {FILTERS.map((fl) => (
            <button
              key={fl.id}
              className="btn btn-sm"
              style={{
                background: filter === fl.id ? "var(--primary)" : "var(--surface)",
                color: filter === fl.id ? "#fff" : "var(--text)",
                border: `1px solid ${filter === fl.id ? "var(--primary)" : "var(--border)"}`,
                fontWeight: filter === fl.id ? 600 : 400,
              }}
              onClick={() => setFilter(fl.id)}
            >
              {fl.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "var(--radius)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px dashed var(--border)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👥</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No friends found</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            {search ? "No friends match your search." : "Add friends to start tracking boarding money, meals, and loans."}
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Friend
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {filtered.map((f) => {
            const hue = stringToHue(f.name);
            const net = f.balance.net;
            const netColor = net > 0.01 ? "var(--income)" : net < -0.01 ? "var(--expense)" : "var(--muted)";
            const netLabel = net > 0.01 ? `Owes you ${formatCurrency(net, currency)}` : net < -0.01 ? `You owe ${formatCurrency(Math.abs(net), currency)}` : "Settled ✅";
            return (
              <div
                key={f.id}
                className="card card-interactive"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                  padding: "1.125rem",
                }}
              >
                <Link
                  href={`/friends/${f.id}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.875rem",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: `hsl(${hue}, 55%, 50%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {initials(f.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </p>
                    {f.phone && (
                      <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0.15rem 0 0" }}>
                        📱 {formatDisplayPhone(f.phone)}
                      </p>
                    )}
                    <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0.15rem 0 0" }}>
                      {f.txCount} tx{f.txCount !== 1 ? "s" : ""} · {f.lastActivity ? `Last: ${formatDate(f.lastActivity, "short")}` : "No activity"}
                    </p>
                  </div>
                </Link>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid var(--border)",
                    marginTop: "auto",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: netColor,
                        display: "inline-block",
                      }}
                    >
                      {netLabel}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Link
                      href={`/friends/${f.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "0.25rem 0.625rem", fontSize: "0.8125rem", minHeight: "32px" }}
                    >
                      Open →
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--expense)", padding: "0.25rem 0.5rem", minHeight: "32px" }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(f);
                      }}
                      title="Remove friend"
                      aria-label={`Remove ${f.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddFriendModal
          onClose={() => setShowModal(false)}
          onAdd={(f) => setFriends((prev) => [...prev, f])}
        />
      )}

      {/* Remove Friend Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Remove ${deleteTarget?.name}?`}
        message={`Are you sure you want to remove ${deleteTarget?.name} from your active friends list? All past transactions will be archived.`}
        confirmText="Remove Friend"
        variant="danger"
        icon="🗑️"
        loading={deleting}
        onConfirm={handleDeleteFriend}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
}
