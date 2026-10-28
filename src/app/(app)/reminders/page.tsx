"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

interface ReminderLog {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  message: string;
  status: string;
  sentAt: string;
  friend: { name: string };
}

export default function RemindersPage() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((j) => { if (j.data) setLogs(j.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "900px" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Reminder History</h1>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "72px" }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No reminders sent yet</h3>
          <p>Go to a friend's page and send your first reminder.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Friend</th>
                <th>Channel</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {formatDate(log.sentAt, "medium")}
                  </td>
                  <td style={{ fontWeight: 500 }}>{log.friend.name}</td>
                  <td>
                    <span className={`badge ${log.channel === "EMAIL" ? "badge-primary" : "badge-accent"}`}>
                      {log.channel === "EMAIL" ? "📧 Email" : "💬 WhatsApp"}
                    </span>
                  </td>
                  <td style={{ maxWidth: "300px", overflow: "hidden" }}>
                    <p style={{ color: "var(--muted)", fontSize: "0.8125rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.message.slice(0, 100)}…
                    </p>
                  </td>
                  <td>
                    <span className={`badge ${log.status === "SENT" ? "badge-income" : "badge-expense"}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
