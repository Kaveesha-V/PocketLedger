import { Resend } from "resend";
import { formatCurrency } from "./format";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM = process.env.EMAIL_FROM ?? "PocketLedger <noreply@pocketledger.app>";

// ─────────────────────────────────────────────
//  Reminder email HTML builder
// ─────────────────────────────────────────────

function reminderHtml(opts: {
  friendName: string;
  senderName: string;
  message: string;
  net: number;
  currency: string;
  statement?: Array<{ date: string; reason: string; amount: string; direction: string }>;
}): string {
  const { friendName, senderName, message, net, currency, statement } = opts;
  const isPositive = net >= 0;
  const amountColor = isPositive ? "#16a34a" : "#e5484d";
  const amountText = formatCurrency(Math.abs(net), currency);

  const rows =
    statement
      ?.map(
        (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #d8e6e0;font-size:13px;">${r.date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #d8e6e0;font-size:13px;">${r.reason || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #d8e6e0;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;">${r.amount}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #d8e6e0;font-size:13px;">${r.direction}</td>
      </tr>`
      )
      .join("") ?? "";

  const statementTable = statement
    ? `
    <h3 style="font-family:Poppins,sans-serif;font-size:16px;margin:24px 0 12px;">Statement</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #d8e6e0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#eaf3ef;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7f77;">Date</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7f77;">Reason</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7f77;">Amount</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7f77;">Type</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f6faf8;font-family:Inter,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,35,29,0.10);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f9d78,#0a6e54);padding:32px 32px 24px;text-align:center;">
      <h1 style="font-family:Poppins,sans-serif;color:#fff;margin:0;font-size:24px;">💰 PocketLedger</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Money reminder from ${senderName}</p>
    </div>
    <!-- Balance highlight -->
    <div style="padding:24px 32px;border-bottom:1px solid #eaf3ef;text-align:center;">
      <p style="margin:0 0 4px;color:#6b7f77;font-size:13px;">Net balance</p>
      <p style="margin:0;font-size:2rem;font-weight:700;color:${amountColor};font-family:Poppins,sans-serif;font-variant-numeric:tabular-nums;">${amountText}</p>
    </div>
    <!-- Message -->
    <div style="padding:24px 32px;">
      <p style="white-space:pre-line;color:#10231d;line-height:1.7;font-size:15px;">${message}</p>
      ${statementTable}
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f6faf8;text-align:center;border-top:1px solid #eaf3ef;">
      <p style="margin:0;font-size:12px;color:#6b7f77;">Sent via PocketLedger · Manage your money smarter</p>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────
//  Send reminder email
// ─────────────────────────────────────────────

export async function sendReminderEmail(opts: {
  to: string;
  friendName: string;
  senderName: string;
  message: string;
  net: number;
  currency: string;
  statement?: Array<{ date: string; reason: string; amount: string; direction: string }>;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured. Skipping email.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Money reminder from ${opts.senderName} — PocketLedger`,
      html: reminderHtml(opts),
    });
    return { success: true };
  } catch (e) {
    console.error("[email] send failed:", e);
    return { success: false, error: String(e) };
  }
}

// ─────────────────────────────────────────────
//  Welcome email
// ─────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to PocketLedger 🎉",
      html: `
      <div style="max-width:520px;margin:32px auto;font-family:Inter,sans-serif;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,35,29,0.10);">
        <div style="background:linear-gradient(135deg,#0f9d78,#0a6e54);padding:32px;text-align:center;">
          <h1 style="font-family:Poppins,sans-serif;color:#fff;margin:0;">Welcome, ${name}! 🌿</h1>
        </div>
        <div style="padding:32px;">
          <p>You're all set on <strong>PocketLedger</strong> — your personal budget & money tracker.</p>
          <p>Get started in 3 steps:</p>
          <ol style="padding-left:20px;line-height:2;">
            <li>📊 <strong>Add your first budget entry</strong></li>
            <li>👥 <strong>Add a friend</strong></li>
            <li>💸 <strong>Record your first lend/borrow</strong></li>
          </ol>
        </div>
      </div>`,
    });
  } catch (e) {
    console.error("[email] welcome failed:", e);
  }
}

