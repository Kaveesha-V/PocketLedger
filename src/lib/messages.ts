// ─────────────────────────────────────────────
//  Reminder message template engine
// ─────────────────────────────────────────────

export interface ReminderTemplates {
  theyOweMe: string;
  iOweThem: string;
  settled: string;
}

export const DEFAULT_TEMPLATES: ReminderTemplates = {
  theyOweMe: `Hi {friend}, hope you're doing well! 😊
Just a gentle reminder — you owe me {currency} {amount}.
Details: {count} transactions, last on {lastDate}.
Please send it when you can. Thanks!
— {myName}`,

  iOweThem: `Hi {friend}, I'm noting that I owe you {currency} {amount}.
I'll pay it back by {date}. Thanks for helping me! 🙏
— {myName}`,

  settled: `Hi {friend}, all settled between us ✅ Thanks!
— {myName}`,
};

export interface TemplateVars {
  friend: string;
  currency: string;
  amount: string;
  count?: number;
  lastDate?: string;
  myName: string;
  date?: string;
}

/**
 * Render a template string by replacing {variable} placeholders.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = vars[key as keyof TemplateVars];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

/**
 * Build a WhatsApp deep-link URL.
 * Phase 1: wa.me click-to-chat (no API needed).
 */
export function buildWhatsappUrl(phone: string, message: string): string {
  // Strip all non-digit characters except leading +
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}

/**
 * Parse stored reminder templates JSON or fall back to defaults.
 */
export function parseTemplates(json: string | null | undefined): ReminderTemplates {
  if (!json) return DEFAULT_TEMPLATES;
  try {
    const parsed = JSON.parse(json) as Partial<ReminderTemplates>;
    return {
      theyOweMe: parsed.theyOweMe ?? DEFAULT_TEMPLATES.theyOweMe,
      iOweThem: parsed.iOweThem ?? DEFAULT_TEMPLATES.iOweThem,
      settled: parsed.settled ?? DEFAULT_TEMPLATES.settled,
    };
  } catch {
    return DEFAULT_TEMPLATES;
  }
}
