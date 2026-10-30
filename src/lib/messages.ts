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
 * Normalize any phone number into an international E.164-compatible digit string without '+'.
 * Handles:
 *  - Sri Lankan local numbers starting with 0: "0769055019" -> "94769055019"
 *  - Numbers with leading double zeros: "0094769055019" -> "94769055019"
 *  - Numbers with '+' prefix: "+94 76 905 5019" -> "94769055019"
 *  - 9-digit numbers missing leading 0 or country code: "769055019" -> "94769055019"
 *  - Other international numbers: "+1 555 234 5678" -> "15552345678"
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = "94"): string {
  if (!phone) return "";
  const trimmed = phone.trim();

  // If user explicitly prefixed with +, strip + and keep the remaining digits
  if (trimmed.startsWith("+")) {
    return trimmed.replace(/\D/g, "");
  }

  // Strip non-digits
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // If starts with 00 (international call prefix, e.g. 0094...)
  if (digits.startsWith("00")) {
    digits = digits.replace(/^00+/, "");
  }

  // If starts with single 0 (national trunk code, e.g. 0769055019)
  if (digits.startsWith("0")) {
    const withoutZero = digits.replace(/^0+/, "");
    // If remaining length is standard Sri Lankan (9 digits, e.g. 769055019), prepend 94
    if (withoutZero.length === 9) {
      return `${defaultCountryCode}${withoutZero}`;
    }
    return `${defaultCountryCode}${withoutZero}`;
  }

  // If user entered exactly 9 digits (common in Sri Lanka: e.g. 769055019)
  if (digits.length === 9) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits;
}

/**
 * Format a phone number for human-friendly display (e.g. +94 76 905 5019).
 */
export function formatDisplayPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const norm = normalizePhoneNumber(phone);
  if (!norm) return phone;

  // Sri Lanka format: 94 + 9 digits -> +94 XX XXX XXXX
  if (norm.startsWith("94") && norm.length === 11) {
    const operator = norm.slice(2, 4);
    const part1 = norm.slice(4, 7);
    const part2 = norm.slice(7);
    return `+94 ${operator} ${part1} ${part2}`;
  }

  return `+${norm}`;
}

/**
 * Build a WhatsApp deep-link URL.
 * Uses normalized international digits so wa.me opens the correct chat.
 */
export function buildWhatsappUrl(phone: string, message: string): string {
  const digits = normalizePhoneNumber(phone);
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
