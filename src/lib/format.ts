import { type Decimal } from "@prisma/client/runtime/library";

// ─────────────────────────────────────────────
//  Currency formatting
// ─────────────────────────────────────────────

export const CURRENCIES = [
  { code: "LKR", name: "Sri Lankan Rupee",  symbol: "Rs." },
  { code: "USD", name: "US Dollar",         symbol: "$"   },
  { code: "INR", name: "Indian Rupee",      symbol: "₹"   },
  { code: "SGD", name: "Singapore Dollar",  symbol: "S$"  },
  { code: "GBP", name: "British Pound",     symbol: "£"   },
  { code: "EUR", name: "Euro",              symbol: "€"   },
  { code: "AUD", name: "Australian Dollar", symbol: "A$"  },
];

export function formatCurrency(
  amount: number | Decimal | string,
  currency = "LKR",
  opts?: Intl.NumberFormatOptions
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...opts,
    }).format(num);
  } catch {
    // Fallback for unknown currency codes
    const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
    return `${sym} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatAmount(amount: number | Decimal | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─────────────────────────────────────────────
//  Date formatting
// ─────────────────────────────────────────────

export function formatDate(
  date: Date | string,
  fmt: "short" | "medium" | "long" | "relative" = "medium"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  if (fmt === "relative") {
    return formatRelative(d);
  }

  const opts: Intl.DateTimeFormatOptions =
    fmt === "short"
      ? { day: "2-digit", month: "short" }
      : fmt === "medium"
      ? { day: "2-digit", month: "short", year: "numeric" }
      : { weekday: "short", day: "2-digit", month: "long", year: "numeric" };

  return d.toLocaleDateString("en-US", opts);
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getMonthRange(yearOrMonthStr: number | string, month?: number) {
  if (typeof yearOrMonthStr === "string") {
    const parts = yearOrMonthStr.split("-");
    const y = parseInt(parts[0], 10) || new Date().getFullYear();
    const m = parseInt(parts[1], 10) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { start, end };
  }
  const m = month ?? (new Date().getMonth() + 1);
  const start = new Date(yearOrMonthStr, m - 1, 1);
  const end = new Date(yearOrMonthStr, m, 0, 23, 59, 59, 999);
  return { start, end };
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────
//  Misc helpers
// ─────────────────────────────────────────────

/** Truncate long strings */
export function truncate(str: string, max = 40): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** Initials from name */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Consistent hue from string (for avatar colors) */
export function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
