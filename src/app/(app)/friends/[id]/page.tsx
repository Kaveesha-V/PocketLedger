"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, formatDate, initials, stringToHue } from "@/lib/format";
import { buildWhatsappUrl, parseTemplates, renderTemplate } from "@/lib/messages";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type LedgerDirection = "I_GAVE" | "I_BORROWED" | "THEY_REPAID" | "I_REPAID";

interface TimelineEntry {
  id: string;
  direction: LedgerDirection;
  amount: number;
  date: string;
  reason: string | null;
  dueDate: string | null;
  settled: boolean;
  runningBalance: number;
}

interface FriendDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  balance: {
    net: number;
    owedToMe: number;
    iOwe: number;
    timesGave: number;
    timesBorrowed: number;
    totalGiven: number;
    totalBorrowed: number;
  };
  timeline: TimelineEntry[];
  reminders: Array<{ channel: string; sentAt: string; status: string }>;
}

const DIRECTION_LABELS: Record<LedgerDirection, { label: string; color: string; sign: "+" | "-" }> = {
  I_GAVE:      { label: "I gave",     color: "var(--income)",  sign: "+" },
  I_BORROWED:  { label: "I borrowed", color: "var(--expense)", sign: "-" },
  THEY_REPAID: { label: "They repaid",color: "var(--income)",  sign: "+" },
  I_REPAID:    { label: "I repaid",   color: "var(--expense)", sign: "-" },
};

const DIRS: { id: LedgerDirection; label: string; color: string }[] = [
  { id: "I_GAVE", label: "💸 I gave", color: "var(--income)" },
  { id: "I_BORROWED", label: "🤲 I borrowed", color: "var(--expense)" },
  { id: "THEY_REPAID", label: "✅ They repaid", color: "var(--primary)" },
  { id: "I_REPAID", label: "🔄 I repaid", color: "var(--muted)" },
];

function QuickAddModal({
  friendId,
  friendName,
  initialDirection = "I_GAVE",
  balance,
  onClose,
  onSaved,
}: {
  friendId: string;
  friendName: string;
  initialDirection?: LedgerDirection;
  balance: FriendDetail["balance"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const currency = "LKR";
  const [form, setForm] = useState({
    direction: initialDirection,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reason: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewNet = (() => {
    const a = parseFloat(form.amount) || 0;
    let n = balance.net;
    if (form.direction === "I_GAVE") n += a;
    if (form.direction === "I_BORROWED") n -= a;
    if (form.direction === "THEY_REPAID") n -= a;
    if (form.direction === "I_REPAID") n += a;
    return n;
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, friendId, amount: parseFloat(form.amount) }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      onSaved();
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
        style={{ width: "100%", maxWidth: "480px", padding: "1.75rem", background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>Add transaction with {friendName}</h2>
        {error && (
          <div style={{ color: "var(--expense)", background: "color-mix(in srgb, var(--expense) 10%, transparent)", padding: "0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {DIRS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    border: `2px solid ${form.direction === d.id ? d.color : "var(--border)"}`,
                    background: form.direction === d.id ? `color-mix(in srgb, ${d.color} 15%, transparent)` : "transparent",
                    color: form.direction === d.id ? d.color : "var(--text)",
                    fontWeight: form.direction === d.id ? 600 : 400,
                  }}
                  onClick={() => setForm((f) => ({ ...f, direction: d.id }))}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="tx-amount">Amount ({currency}) *</label>
            <input
              id="tx-amount"
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="tx-date">Date</label>
            <input
              id="tx-date"
              className="input"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="tx-reason">Reason <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
            <input
              id="tx-reason"
              className="input"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Lunch, hostel fee, groceries…"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="tx-due">Due date <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
            <input
              id="tx-due"
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          {form.amount && (
            <div style={{ padding: "0.875rem", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--muted)" }}>
              After this,{" "}
              <strong style={{ color: previewNet > 0 ? "var(--income)" : previewNet < 0 ? "var(--expense)" : "var(--text)" }}>
                {previewNet > 0.01
                  ? `${friendName} will owe you ${formatCurrency(previewNet, currency)}`
                  : previewNet < -0.01
                  ? `You will owe ${friendName} ${formatCurrency(Math.abs(previewNet), currency)}`
                  : "you'll be all settled ✅"}
              </strong>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button id="btn-save-tx" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Saving…" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTxModal({
  entry,
  friendName,
  onClose,
  onSaved,
}: {
  entry: TimelineEntry;
  friendName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const currency = "LKR";
  const [form, setForm] = useState({
    direction: entry.direction,
    amount: String(entry.amount),
    date: entry.date ? new Date(entry.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    reason: entry.reason ?? "",
    dueDate: entry.dueDate ? new Date(entry.dueDate).toISOString().split("T")[0] : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ledger/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: form.direction,
          amount: parseFloat(form.amount),
          date: form.date,
          reason: form.reason || null,
          dueDate: form.dueDate || null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      onSaved();
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
        style={{ width: "100%", maxWidth: "480px", padding: "1.75rem", background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>Edit Transaction ({friendName})</h2>
        {error && (
          <div style={{ color: "var(--expense)", background: "color-mix(in srgb, var(--expense) 10%, transparent)", padding: "0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {DIRS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    border: `2px solid ${form.direction === d.id ? d.color : "var(--border)"}`,
                    background: form.direction === d.id ? `color-mix(in srgb, ${d.color} 15%, transparent)` : "transparent",
                    color: form.direction === d.id ? d.color : "var(--text)",
                    fontWeight: form.direction === d.id ? 600 : 400,
                  }}
                  onClick={() => setForm((f) => ({ ...f, direction: d.id }))}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="edit-amount">Amount ({currency}) *</label>
            <input
              id="edit-amount"
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="edit-date">Date</label>
            <input
              id="edit-date"
              className="input"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="edit-reason">Reason</label>
            <input
              id="edit-reason"
              className="input"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Reason…"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="edit-due">Due date</label>
            <input
              id="edit-due"
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Updating…" : "Update Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReminderPanel({ friend, onSent }: { friend: FriendDetail; onSent: () => void }) {
  const currency = "LKR";
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const templates = parseTemplates(null);
    const net = friend.balance.net;
    const templateKey = Math.abs(net) < 0.01 ? "settled" : net > 0 ? "theyOweMe" : "iOweThem";
    const rendered = renderTemplate(templates[templateKey], {
      friend: friend.name,
      currency,
      amount: formatCurrency(Math.abs(net), currency),
      count: friend.balance.timesGave + friend.balance.timesBorrowed,
      lastDate: friend.timeline[friend.timeline.length - 1]?.date
        ? formatDate(friend.timeline[friend.timeline.length - 1].date, "short")
        : "—",
      myName: "Me",
    });
    setMessage(rendered);
  }, [friend]);

  async function send() {
    setLoading(true);
    setFeedback("");
    try {
      if (channel === "whatsapp") {
        if (!friend.phone) {
          setFeedback("⚠️ No WhatsApp number added for this friend.");
          setLoading(false);
          return;
        }
        const url = buildWhatsappUrl(friend.phone, message);
        window.open(url, "_blank");
        await fetch("/api/reminders/whatsapp-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: friend.id, message }),
        });
        setFeedback("✅ WhatsApp opened. Reminder logged.");
        onSent();
      } else {
        if (!friend.email) {
          setFeedback("⚠️ No email address added for this friend.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/reminders/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: friend.id, message }),
        });
        const json = await res.json();
        if (json.error) {
          setFeedback(`⚠️ ${json.error}`);
        } else {
          setFeedback("✅ Email sent successfully!");
          onSent();
        }
      }
    } catch {
      setFeedback("⚠️ Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Send Reminder</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["whatsapp", "email"] as const).map((ch) => (
          <button
            key={ch}
            className="btn btn-sm"
            style={{
              flex: 1,
              border: `2px solid ${channel === ch ? "var(--primary)" : "var(--border)"}`,
              background: channel === ch ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
              color: channel === ch ? "var(--primary)" : "var(--text)",
              fontWeight: channel === ch ? 600 : 400,
            }}
            onClick={() => setChannel(ch)}
          >
            {ch === "whatsapp" ? "💬 WhatsApp" : "📧 Email"}
          </button>
        ))}
      </div>
      <textarea
        className="input"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ resize: "vertical", fontFamily: "Inter, sans-serif", fontSize: "0.875rem", lineHeight: 1.6 }}
      />
      {feedback && (
        <p style={{ fontSize: "0.875rem", color: feedback.startsWith("✅") ? "var(--income)" : "var(--expense)", marginTop: "0.5rem" }}>
          {feedback}
        </p>
      )}
      <button
        id="btn-send-reminder"
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "0.75rem" }}
        onClick={send}
        disabled={loading}
      >
        {loading ? "Sending…" : `Send via ${channel === "whatsapp" ? "WhatsApp" : "Email"}`}
      </button>
    </div>
  );
}

export default function FriendDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const currency = "LKR";

  const [friend, setFriend] = useState<FriendDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addDir, setAddDir] = useState<LedgerDirection>("I_GAVE");
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);

  // Custom modals state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settling, setSettling] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [deletingTx, setDeletingTx] = useState(false);
  const [showDeleteFriendModal, setShowDeleteFriendModal] = useState(false);
  const [deletingFriend, setDeletingFriend] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/friends/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setFriend(j.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSettle() {
    setSettling(true);
    try {
      await fetch(`/api/ledger/settle/${id}`, { method: "POST" });
      load();
    } finally {
      setSettling(false);
      setShowSettleModal(false);
    }
  }

  async function handleDeleteTx() {
    if (!deleteTxId) return;
    setDeletingTx(true);
    try {
      await fetch(`/api/ledger/${deleteTxId}`, { method: "DELETE" });
      load();
    } finally {
      setDeletingTx(false);
      setDeleteTxId(null);
    }
  }

  async function handleDeleteFriend() {
    setDeletingFriend(true);
    try {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
      router.push("/friends");
    } finally {
      setDeletingFriend(false);
      setShowDeleteFriendModal(false);
    }
  }

  function openAddWithDir(dir: LedgerDirection) {
    setAddDir(dir);
    setShowAdd(true);
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div className="skeleton" style={{ height: "200px" }} />
      </div>
    );
  }

  if (!friend) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Friend not found.</p>
      </div>
    );
  }

  const { balance } = friend;
  const net = balance.net;
  const netColor = net > 0.01 ? "var(--income)" : net < -0.01 ? "var(--expense)" : "var(--muted)";
  const netLabel = net > 0.01 ? `${friend.name} owes you` : net < -0.01 ? `You owe ${friend.name}` : "All settled ✅";
  const hue = stringToHue(friend.name);

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "920px" }}>
      {/* Top Bar with Back + Remove Friend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
          ← Back
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--expense)", gap: "0.375rem" }}
          onClick={() => setShowDeleteFriendModal(true)}
          title="Remove this friend"
        >
          🗑️ Remove Friend
        </button>
      </div>

      {/* Header */}
      <div className="card" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: `hsl(${hue}, 55%, 50%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          {initials(friend.name)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{friend.name}</h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {friend.email && <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>📧 {friend.email}</span>}
            {friend.phone && <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>📱 {friend.phone}</span>}
            {friend.note && <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>📝 {friend.note}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>{netLabel}</p>
          <p className="money" style={{ fontSize: "2rem", fontFamily: "Poppins, sans-serif", fontWeight: 700, color: netColor, margin: 0 }}>
            {Math.abs(net) < 0.01 ? "—" : formatCurrency(Math.abs(net), currency)}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {[
          { label: "Times I gave", value: balance.timesGave },
          { label: "Times I borrowed", value: balance.timesBorrowed },
          { label: "Total given", value: formatCurrency(balance.totalGiven, currency) },
          { label: "Total borrowed", value: formatCurrency(balance.totalBorrowed, currency) },
        ].map((s) => (
          <div key={s.label} className="card" style={{ flex: "1 1 120px", textAlign: "center", padding: "1rem" }}>
            <p className="money" style={{ fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>{s.value}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Action buttons */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <button
          id="btn-i-gave"
          className="btn btn-sm"
          style={{ background: "var(--income)", color: "#fff" }}
          onClick={() => openAddWithDir("I_GAVE")}
        >
          💸 I gave
        </button>
        <button
          id="btn-i-borrowed"
          className="btn btn-sm"
          style={{ background: "var(--expense)", color: "#fff" }}
          onClick={() => openAddWithDir("I_BORROWED")}
        >
          🤲 I borrowed
        </button>
        <button
          id="btn-they-paid"
          className="btn btn-sm btn-ghost"
          style={{ border: "1px solid var(--border)" }}
          onClick={() => openAddWithDir("THEY_REPAID")}
        >
          ✅ They paid
        </button>
        <button
          id="btn-i-paid"
          className="btn btn-sm btn-ghost"
          style={{ border: "1px solid var(--border)" }}
          onClick={() => openAddWithDir("I_REPAID")}
        >
          🔄 I paid
        </button>
        {Math.abs(net) > 0.01 && (
          <button
            id="btn-settle-up"
            className="btn btn-sm"
            style={{ background: "var(--accent)", color: "#000", fontWeight: 600 }}
            onClick={() => setShowSettleModal(true)}
            disabled={settling}
          >
            🤝 Settle up
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
        {/* Timeline / Transaction History */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>Transaction History</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {friend.timeline.length} transaction{friend.timeline.length !== 1 ? "s" : ""}
            </span>
          </div>

          {friend.timeline.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--muted)" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</p>
              <p style={{ margin: 0 }}>No transactions yet. Use the buttons above to add one!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Balance</th>
                    <th style={{ textAlign: "center", width: "90px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...friend.timeline].reverse().map((t) => {
                    const meta = DIRECTION_LABELS[t.direction];
                    return (
                      <tr key={t.id}>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "var(--muted)" }}>
                          {formatDate(t.date, "short")}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                              color: meta.color,
                            }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                          {t.reason ?? "—"}
                          {t.dueDate && (
                            <span style={{ color: "var(--accent)", fontSize: "0.75rem", marginLeft: "0.375rem" }}>
                              Due {formatDate(t.dueDate, "short")}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }} className="money">
                          <span style={{ color: meta.color, fontWeight: 600 }}>
                            {meta.sign}{formatCurrency(t.amount, currency)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }} className="money">
                          <span
                            style={{
                              color: t.runningBalance > 0 ? "var(--income)" : t.runningBalance < 0 ? "var(--expense)" : "var(--muted)",
                              fontWeight: 500,
                              fontSize: "0.875rem",
                            }}
                          >
                            {formatCurrency(Math.abs(t.runningBalance), currency)}{" "}
                            {t.runningBalance > 0 ? "▲" : t.runningBalance < 0 ? "▼" : ""}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "0.25rem 0.5rem" }}
                              onClick={() => setEditingEntry(t)}
                              title="Edit transaction"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "0.25rem 0.5rem", color: "var(--expense)" }}
                              onClick={() => setDeleteTxId(t.id)}
                              title="Delete transaction"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reminder panel */}
        <ReminderPanel friend={friend} onSent={load} />
      </div>

      {/* Quick Add Modal */}
      {showAdd && (
        <QuickAddModal
          friendId={id}
          friendName={friend.name}
          initialDirection={addDir}
          balance={balance}
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingEntry && (
        <EditTxModal
          entry={editingEntry}
          friendName={friend.name}
          onClose={() => setEditingEntry(null)}
          onSaved={load}
        />
      )}

      {/* Settle Up Confirmation Modal */}
      <ConfirmModal
        isOpen={showSettleModal}
        title={`Settle Balances with ${friend.name}`}
        message={`Are you sure you want to settle all pending transactions? This will bring the net balance with ${friend.name} to 0.`}
        confirmText="Yes, Settle Up"
        variant="primary"
        icon="🤝"
        loading={settling}
        onConfirm={handleSettle}
        onCancel={() => setShowSettleModal(false)}
      />

      {/* Delete Transaction Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTxId)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? It will be permanently removed from this friend's ledger."
        confirmText="Delete"
        variant="danger"
        icon="🗑️"
        loading={deletingTx}
        onConfirm={handleDeleteTx}
        onCancel={() => setDeleteTxId(null)}
      />

      {/* Remove Friend Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteFriendModal}
        title={`Remove ${friend.name}?`}
        message={`This will remove ${friend.name} from your active friends list and archive their ledger transactions.`}
        confirmText="Remove Friend"
        variant="danger"
        icon="⚠️"
        loading={deletingFriend}
        onConfirm={handleDeleteFriend}
        onCancel={() => setShowDeleteFriendModal(false)}
      />
    </div>
  );
}
