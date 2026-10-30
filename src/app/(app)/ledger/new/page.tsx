"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface Friend {
  id: string;
  name: string;
  net?: number;
}

export default function NewLedgerTransactionPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const [friendId, setFriendId] = useState("");
  const [direction, setDirection] = useState<
    "I_GAVE" | "I_BORROWED" | "THEY_REPAID" | "I_REPAID"
  >("I_GAVE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setFriends(j.data);
          if (j.data.length > 0) setFriendId(j.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedFriend = friends.find((f) => f.id === friendId);
  const currentNet = selectedFriend?.net ?? 0;
  const numAmount = parseFloat(amount) || 0;

  // Live balance preview calculation
  // net > 0: friend owes me, net < 0: I owe friend
  // I_GAVE: increases what they owe me (+amount)
  // I_BORROWED: decreases what they owe me (-amount)
  // THEY_REPAID: decreases what they owe me (-amount)
  // I_REPAID: increases what they owe me (+amount)
  let delta = 0;
  if (direction === "I_GAVE" || direction === "I_REPAID") delta = numAmount;
  else if (direction === "I_BORROWED" || direction === "THEY_REPAID") delta = -numAmount;
  const newNet = currentNet + delta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!friendId) {
      setErrorMsg("Please select a friend");
      return;
    }
    if (numAmount <= 0) {
      setErrorMsg("Please enter a valid positive amount");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId,
          direction,
          amount: numAmount,
          date: new Date(date).toISOString(),
          reason: reason.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Failed to record transaction");
      } else {
        router.push(`/friends/${friendId}`);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/friends" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to Friends
        </Link>
        <h1 style={{ marginTop: "0.5rem" }}>Record Lend / Borrow</h1>
      </div>

      {loading ? (
        <div className="card" style={{ height: "300px" }}>
          <div className="skeleton" style={{ height: "100%" }} />
        </div>
      ) : friends.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</p>
          <h3>No friends yet</h3>
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            Add a friend first before recording money transactions.
          </p>
          <Link href="/friends" className="btn btn-primary">
            + Add a Friend
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {errorMsg && (
            <div style={{ padding: "0.75rem", background: "rgba(229, 72, 77, 0.12)", color: "var(--expense)", borderRadius: "var(--radius-sm)", fontSize: "0.875rem" }}>
              {errorMsg}
            </div>
          )}

          {/* Friend Select */}
          <div>
            <label className="label">Select Friend</label>
            <select
              className="input"
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
            >
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.net !== undefined ? (f.net > 0 ? `owes you ${formatCurrency(f.net)}` : f.net < 0 ? `you owe ${formatCurrency(Math.abs(f.net))}` : "Settled") : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Direction Segmented buttons */}
          <div>
            <label className="label">Transaction Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                className={`btn btn-sm ${direction === "I_GAVE" ? "btn-primary" : "btn-ghost"}`}
                style={{
                  background: direction === "I_GAVE" ? "var(--income)" : undefined,
                  color: direction === "I_GAVE" ? "#fff" : undefined,
                }}
                onClick={() => setDirection("I_GAVE")}
              >
                💸 I Gave (Lent)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${direction === "I_BORROWED" ? "btn-primary" : "btn-ghost"}`}
                style={{
                  background: direction === "I_BORROWED" ? "var(--expense)" : undefined,
                  color: direction === "I_BORROWED" ? "#fff" : undefined,
                }}
                onClick={() => setDirection("I_BORROWED")}
              >
                🤲 I Borrowed
              </button>
              <button
                type="button"
                className={`btn btn-sm ${direction === "THEY_REPAID" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDirection("THEY_REPAID")}
              >
                ✅ They Paid Me
              </button>
              <button
                type="button"
                className={`btn btn-sm ${direction === "I_REPAID" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDirection("I_REPAID")}
              >
                🤝 I Paid Them
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Date & Due Date */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Due Date (Optional)</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Reason / Note */}
          <div>
            <label className="label">Reason / Note</label>
            <input
              type="text"
              placeholder="e.g. Lunch money, Boarding electricity bill"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Live Preview Card */}
          {selectedFriend && numAmount > 0 && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius)",
                background: "var(--surface-2)",
                border: "1px dashed var(--border)",
              }}
            >
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
                Balance impact preview:
              </p>
              <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: "0.25rem 0 0" }}>
                After this,{" "}
                <strong style={{ color: "var(--text)" }}>{selectedFriend.name}</strong>{" "}
                {newNet > 0 ? (
                  <span style={{ color: "var(--income)" }}>will owe you {formatCurrency(newNet)}</span>
                ) : newNet < 0 ? (
                  <span style={{ color: "var(--expense)" }}>
                    you will owe them {formatCurrency(Math.abs(newNet))}
                  </span>
                ) : (
                  <span style={{ color: "var(--primary)" }}>will be fully settled ✅</span>
                )}
              </p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Link href="/friends" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Record Transaction"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
