"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { Bell, Mail, MessageCircle } from "lucide-react";

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
    <div className="page-container">
      <h1 style={{ marginBottom: "1.5rem" }}>Reminder History</h1>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "var(--radius)" }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 1rem",
              borderRadius: "16px",
              background: "color-mix(in srgb, var(--primary) 15%, transparent)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={28} />
          </div>
          <h3 style={{ marginBottom: "0.5rem" }}>No reminders sent yet</h3>
          <p>Go to a friend&apos;s page and send your first reminder.</p>
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
                      {log.channel === "EMAIL" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <Mail size={13} /> Email
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <MessageCircle size={13} /> WhatsApp
                        </span>
                      )}
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
