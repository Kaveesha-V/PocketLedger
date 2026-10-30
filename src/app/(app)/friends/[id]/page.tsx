"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency, formatDate, initials, stringToHue } from "@/lib/format";
import {
  buildWhatsappUrl,
  formatDisplayPhone,
  parseTemplates,
  generateReminderMessage,
} from "@/lib/messages";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  AlertCircle,
  Send,
  Calendar,
  Handshake,
  Globe,
  RefreshCw,
} from "lucide-react";

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
  { id: "I_GAVE", label: "I gave", color: "var(--income)" },
  { id: "I_BORROWED", label: "I borrowed", color: "var(--expense)" },
  { id: "THEY_REPAID", label: "They repaid", color: "var(--primary)" },
  { id: "I_REPAID", label: "I repaid", color: "var(--muted)" },
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
                  : "you'll be all settled"}
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

function EditFriendModal({
  friend,
  onClose,
  onSaved,
}: {
  friend: FriendDetail;
  onClose: () => void;
  onSaved: (updated: { name: string; phone: string | null; email: string | null; note: string | null }) => void;
}) {
  const [form, setForm] = useState({
    name: friend.name,
    phone: friend.phone || "",
    email: friend.email || "",
    note: friend.note || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter a name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/friends/${friend.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          note: form.note.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      onSaved(json.data);
      onClose();
    } catch {
      setError("Failed to update friend.");
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
        style={{ width: "100%", maxWidth: "460px", padding: "1.75rem", background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>Edit Friend Details</h2>
        {error && (
          <div style={{ color: "var(--expense)", background: "color-mix(in srgb, var(--expense) 10%, transparent)", padding: "0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Full Name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">
              WhatsApp Number <span style={{ fontWeight: 400, color: "var(--muted)" }}>(e.g. 0769055019 or +94769055019)</span>
            </label>
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="0769055019"
            />
          </div>
          <div className="field">
            <label className="label">Email Address</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="friend@example.com"
            />
          </div>
          <div className="field">
            <label className="label">Note / Relationship</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Roommate, batchmate, etc."
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReminderPanel({
  friend,
  onSent,
  onOpenEdit,
  onPhoneUpdated,
}: {
  friend: FriendDetail;
  onSent: () => void;
  onOpenEdit: () => void;
  onPhoneUpdated: () => void;
}) {
  const { data: session } = useSession();
  const currency = "LKR";
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [language, setLanguage] = useState<"si" | "en">("si");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [directWhatsappUrl, setDirectWhatsappUrl] = useState("");
  const [inlinePhone, setInlinePhone] = useState("");
  const [savingInlinePhone, setSavingInlinePhone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pl_reminder_lang");
    if (saved === "si" || saved === "en") {
      setLanguage(saved);
    }
  }, []);

  const lastTx = friend.timeline && friend.timeline.length > 0 ? friend.timeline[friend.timeline.length - 1] : null;
  const lastTxDate = lastTx ? lastTx.date : (friend as any).lastActivity || new Date().toISOString();
  const myName = session?.user?.name || "Kaveesha";

  useEffect(() => {
    const generated = generateReminderMessage({
      friendName: friend.name,
      myName,
      currency,
      net: friend?.balance?.net ?? 0,
      lastTxDate,
      language,
    });
    setMessage(generated);
  }, [friend, myName, language]);

  function handleLanguageSwitch(lang: "si" | "en") {
    setLanguage(lang);
    localStorage.setItem("pl_reminder_lang", lang);
    const generated = generateReminderMessage({
      friendName: friend.name,
      myName,
      currency,
      net: friend?.balance?.net ?? 0,
      lastTxDate,
      language: lang,
    });
    setMessage(generated);
  }

  function handleResetMessage() {
    const generated = generateReminderMessage({
      friendName: friend.name,
      myName,
      currency,
      net: friend?.balance?.net ?? 0,
      lastTxDate,
      language,
    });
    setMessage(generated);
    setFeedback({ text: "Message reset to template with database values", type: "success" });
    setTimeout(() => setFeedback(null), 2500);
  }

  async function saveInlinePhone() {
    if (!inlinePhone.trim()) return;
    setSavingInlinePhone(true);
    try {
      const res = await fetch(`/api/friends/${friend.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: inlinePhone.trim() }),
      });
      const json = await res.json();
      if (!json.error) {
        onPhoneUpdated();
        setInlinePhone("");
        setFeedback({ text: "Phone number saved!", type: "success" });
      }
    } catch {
      setFeedback({ text: "Failed to save phone number.", type: "error" });
    } finally {
      setSavingInlinePhone(false);
    }
  }

  async function send() {
    setLoading(true);
    setFeedback(null);
    setDirectWhatsappUrl("");
    try {
      if (channel === "whatsapp") {
        if (!friend.phone) {
          setFeedback({ text: "No WhatsApp number added for this friend. Please enter a phone number above.", type: "error" });
          setLoading(false);
          return;
        }
        const url = buildWhatsappUrl(friend.phone, message);
        setDirectWhatsappUrl(url);

        // Open in new tab/window
        window.open(url, "_blank", "noopener,noreferrer");

        await fetch("/api/reminders/whatsapp-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: friend.id, message }),
        });
        setFeedback({ text: "WhatsApp opened. Reminder logged.", type: "success" });
        onSent();
      } else {
        if (!friend.email) {
          setFeedback({ text: "No email address added for this friend.", type: "error" });
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
          setFeedback({ text: json.error || "Failed to send", type: "error" });
        } else {
          setFeedback({ text: "Email sent successfully!", type: "success" });
          onSent();
        }
      }
    } catch {
      setFeedback({ text: "Something went wrong.", type: "error" });
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
            onClick={() => {
              setChannel(ch);
              setDirectWhatsappUrl("");
            }}
          >
            {ch === "whatsapp" ? <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><MessageCircle size={14} /> WhatsApp</span> : <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Mail size={14} /> Email</span>}
          </button>
        ))}
      </div>

      {channel === "whatsapp" && (
        <div style={{ marginBottom: "0.875rem", fontSize: "0.85rem" }}>
          {friend.phone ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "color-mix(in srgb, var(--primary) 8%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
              }}
            >
              <span>
                <MessageCircle size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} /> Target WhatsApp: <strong style={{ color: "var(--primary)" }}>{formatDisplayPhone(friend.phone)}</strong>
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", minHeight: "28px" }}
                onClick={onOpenEdit}
              >
                <Pencil size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "3px" }} /> Edit
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
              }}
            >
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--text)", fontWeight: 500 }}>
                <AlertCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> No WhatsApp number added for {friend.name}. Enter it below:
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="tel"
                  className="input"
                  style={{ flex: "1 1 180px", minHeight: "36px", padding: "0.35rem 0.75rem" }}
                  placeholder="e.g. 0769055019 or +94769055019"
                  value={inlinePhone}
                  onChange={(e) => setInlinePhone(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={saveInlinePhone}
                  disabled={savingInlinePhone || !inlinePhone.trim()}
                >
                  {savingInlinePhone ? "Saving…" : "Save Phone"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {channel === "email" && friend.email && (
        <div
          style={{
            marginBottom: "0.875rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
          }}
        >
          <Mail size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} /> Target Email: <strong>{friend.email}</strong>
        </div>
      )}

      {/* Language Switcher bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.625rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", color: "var(--muted)", fontWeight: 500 }}>
          <Globe size={14} /> Message Language:
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <button
            type="button"
            className={`btn btn-sm ${language === "si" ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "0.2rem 0.65rem", fontSize: "0.8rem", minHeight: "28px" }}
            onClick={() => handleLanguageSwitch("si")}
          >
            සිංහල (Sinhala)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${language === "en" ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "0.2rem 0.65rem", fontSize: "0.8rem", minHeight: "28px" }}
            onClick={() => handleLanguageSwitch("en")}
          >
            English
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.2rem 0.45rem", minHeight: "28px", color: "var(--muted)" }}
            onClick={handleResetMessage}
            title="Re-generate template with database values"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <textarea
        className="input"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ resize: "vertical", fontFamily: "Inter, sans-serif", fontSize: "0.875rem", lineHeight: 1.6 }}
      />
      <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
        Friend name, amount & transaction date are fetched from the database. You can edit this text freely before sending.
      </p>
      {feedback && (
        <p style={{ fontSize: "0.875rem", color: feedback.type === "success" ? "var(--income)" : "var(--expense)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "4px" }}>
          {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {feedback.text}
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

      {directWhatsappUrl && channel === "whatsapp" && (
        <a
          href={directWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
          style={{
            width: "100%",
            marginTop: "0.5rem",
            color: "var(--primary)",
            borderColor: "var(--primary)",
            fontWeight: 600,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><MessageCircle size={15} /> Tap Here to Open WhatsApp Directly ↗</span>
        </a>
      )}
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
  const [showEditFriendModal, setShowEditFriendModal] = useState(false);
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
  const netLabel = net > 0.01 ? `${friend.name} owes you` : net < -0.01 ? `You owe ${friend.name}` : "All settled";
  const hue = stringToHue(friend.name);

  return (
    <div className="page-container">
      {/* Top Bar with Back + Edit Friend + Remove Friend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ borderRadius: "9999px", padding: "0.4rem 0.9rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: "9999px" }}
            onClick={() => setShowEditFriendModal(true)}
            title="Edit friend details & phone"
          >
            <Pencil size={14} /> Edit Friend
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: "9999px", color: "var(--expense)", borderColor: "color-mix(in srgb, var(--expense) 30%, transparent)" }}
            onClick={() => setShowDeleteFriendModal(true)}
            title="Remove this friend"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>

      {/* Header Profile Card */}
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.25rem",
          flexWrap: "wrap",
          background: "var(--surface)",
          borderRadius: "var(--radius)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: "1 1 240px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), var(--primary))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.35rem",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
              flexShrink: 0,
            }}
          >
            {initials(friend.name)}
          </div>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
              {friend.name}
            </h1>
            <div style={{ display: "flex", gap: "0.5rem 0.75rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
              {friend.phone && (
                <span
                  className="badge"
                  style={{
                    background: "color-mix(in srgb, #25D366 15%, transparent)",
                    color: "#25D366",
                  }}
                  title="WhatsApp phone"
                >
                  <Phone size={13} /> {formatDisplayPhone(friend.phone)}
                </span>
              )}
              {friend.email && (
                <span className="badge" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                  <Mail size={13} /> {friend.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", marginLeft: "auto", minWidth: "120px" }}>
          <span
            className="badge"
            style={{
              background:
                net > 0.01
                  ? "color-mix(in srgb, var(--income) 15%, transparent)"
                  : net < -0.01
                  ? "color-mix(in srgb, var(--expense) 15%, transparent)"
                  : "color-mix(in srgb, var(--primary) 15%, transparent)",
              color: net > 0.01 ? "var(--income)" : net < -0.01 ? "var(--expense)" : "var(--primary)",
              marginBottom: "0.25rem",
            }}
          >
            {netLabel}
          </span>
          <p
            className="money"
            style={{
              fontSize: "1.75rem",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              color: netColor,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {Math.abs(net) < 0.01 ? "LKR 0.00" : formatCurrency(Math.abs(net), currency)}
          </p>
        </div>
      </div>

      {/* Stats Cards (2x2 on mobile, 4-col on desktop) */}
      <div className="friend-stats-grid" style={{ marginBottom: "1.25rem" }}>
        {[
          { label: "Times I Gave", value: balance.timesGave, color: "var(--income)" },
          { label: "Times I Borrowed", value: balance.timesBorrowed, color: "var(--expense)" },
          { label: "Total Given", value: formatCurrency(balance.totalGiven, currency), color: "var(--income)" },
          { label: "Total Borrowed", value: formatCurrency(balance.totalBorrowed, currency), color: "var(--expense)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: "1rem 0.75rem", borderRadius: "var(--radius-sm)" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {s.label}
            </p>
            <p className="money" style={{ fontWeight: 700, fontSize: "1.25rem", margin: 0, color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Action buttons (2x2 on mobile, row on desktop) */}
      <div className="friend-actions-grid" style={{ marginBottom: "1.5rem" }}>
        <button
          id="btn-i-gave"
          className="btn btn-sm"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "12px",
            padding: "0.6rem 1rem",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
          }}
          onClick={() => openAddWithDir("I_GAVE")}
        >
          <ArrowUpRight size={16} /> I gave
        </button>
        <button
          id="btn-i-borrowed"
          className="btn btn-sm"
          style={{
            background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "12px",
            padding: "0.6rem 1rem",
            boxShadow: "0 4px 12px rgba(244, 63, 94, 0.25)",
          }}
          onClick={() => openAddWithDir("I_BORROWED")}
        >
          <ArrowDownLeft size={16} /> I borrowed
        </button>
        <button
          id="btn-they-paid"
          className="btn btn-sm btn-ghost"
          style={{ borderRadius: "12px", padding: "0.6rem 1rem", fontWeight: 500 }}
          onClick={() => openAddWithDir("THEY_REPAID")}
        >
          <CheckCircle2 size={16} /> They paid
        </button>
        <button
          id="btn-i-paid"
          className="btn btn-sm btn-ghost"
          style={{ borderRadius: "12px", padding: "0.6rem 1rem", fontWeight: 500 }}
          onClick={() => openAddWithDir("I_REPAID")}
        >
          <RotateCcw size={16} /> I paid
        </button>
        {Math.abs(net) > 0.01 && (
          <button
            id="btn-settle-up"
            className="btn btn-sm"
            style={{
              gridColumn: "1 / -1",
              background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: "12px",
              padding: "0.6rem 1rem",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
            onClick={() => setShowSettleModal(true)}
            disabled={settling}
          >
            <Sparkles size={16} /> Settle up
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
              <div style={{ width: "44px", height: "44px", margin: "0 auto 0.5rem", borderRadius: "50%", background: "var(--surface-2)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={22} /></div>
              <p style={{ margin: 0 }}>No transactions yet. Use the buttons above to add one!</p>
            </div>
          ) : (
            <>
              {/* Desktop View: Full Table */}
              <div className="desktop-only table-wrap">
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
                                <Calendar size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: "3px" }} /> Due {formatDate(t.dueDate, "short")}
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
                              ><Pencil size={14} /></button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: "0.25rem 0.5rem", color: "var(--expense)" }}
                                onClick={() => setDeleteTxId(t.id)}
                                title="Delete transaction"
                              ><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Sleek Modern Cards (Image 3 inspired) */}
              <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[...friend.timeline].reverse().map((t) => {
                  const meta = DIRECTION_LABELS[t.direction];
                  return (
                    <div
                      key={t.id}
                      className="card"
                      style={{
                        padding: "0.875rem 1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            className="badge"
                            style={{
                              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                              color: meta.color,
                              fontWeight: 600,
                            }}
                          >
                            {meta.label}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                            {formatDate(t.date, "short")}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "0.2rem 0.45rem", minHeight: "28px", fontSize: "0.75rem" }}
                            onClick={() => setEditingEntry(t)}
                            title="Edit"
                          ><Pencil size={14} /></button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "0.2rem 0.45rem", minHeight: "28px", fontSize: "0.75rem", color: "var(--expense)" }}
                            onClick={() => setDeleteTxId(t.id)}
                            title="Delete"
                          ><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                        <div style={{ minWidth: 0, flex: 1, paddingRight: "0.5rem" }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: t.reason ? "var(--text)" : "var(--muted)", fontStyle: t.reason ? "normal" : "italic" }}>
                            {t.reason || "No note specified"}
                          </p>
                          {t.dueDate && (
                            <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--accent)" }}>
                              <Calendar size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: "3px" }} /> <Calendar size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: "3px" }} /> Due {formatDate(t.dueDate, "short")}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p className="money" style={{ margin: 0, fontWeight: 700, fontSize: "1.125rem", color: meta.color }}>
                            {meta.sign}{formatCurrency(t.amount, currency)}
                          </p>
                          <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                            Bal: {formatCurrency(Math.abs(t.runningBalance), currency)} {t.runningBalance > 0 ? "▲" : t.runningBalance < 0 ? "▼" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Reminder panel */}
        <ReminderPanel
          friend={friend}
          onSent={load}
          onOpenEdit={() => setShowEditFriendModal(true)}
          onPhoneUpdated={load}
        />
      </div>

      {/* Edit Friend Modal */}
      {showEditFriendModal && (
        <EditFriendModal
          friend={friend}
          onClose={() => setShowEditFriendModal(false)}
          onSaved={(updated) => {
            setFriend((f) => (f ? { ...f, ...updated } : f));
            load();
          }}
        />
      )}

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
        icon={<Sparkles size={22} style={{ color: "var(--primary)" }} />}
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
        icon={<Trash2 size={22} style={{ color: "var(--expense)" }} />}
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
        icon={<AlertTriangle size={22} style={{ color: "var(--expense)" }} />}
        loading={deletingFriend}
        onConfirm={handleDeleteFriend}
        onCancel={() => setShowDeleteFriendModal(false)}
      />
    </div>
  );
}
