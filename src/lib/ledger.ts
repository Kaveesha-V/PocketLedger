import { type Decimal } from "@prisma/client/runtime/library";
import { LedgerDirection } from "@prisma/client";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export interface LedgerTx {
  direction: LedgerDirection;
  amount: Decimal | number | string;
  settled: boolean;
}

export interface FriendBalance {
  owedToMe: number;   // sum(I_GAVE) - sum(THEY_REPAID)  — positive means friend owes me
  iOwe: number;       // sum(I_BORROWED) - sum(I_REPAID)  — positive means I owe them
  net: number;        // owedToMe - iOwe
  // net > 0 → friend owes me; net < 0 → I owe friend; net = 0 → settled
  timesGave: number;
  timesBorrowed: number;
  totalGiven: number;
  totalBorrowed: number;
  totalTheyRepaid: number;
  totalIRepaid: number;
}

// ─────────────────────────────────────────────
//  Core balance calculation
// ─────────────────────────────────────────────

/**
 * Calculate the net balance for a friend from a list of transactions.
 *
 * Spec rule:
 *   owedToMe = Σ I_GAVE − Σ THEY_REPAID
 *   iOwe     = Σ I_BORROWED − Σ I_REPAID
 *   net      = owedToMe − iOwe
 */
export function calcBalance(transactions: LedgerTx[]): FriendBalance {
  let totalGiven = 0;
  let totalBorrowed = 0;
  let totalTheyRepaid = 0;
  let totalIRepaid = 0;
  let timesGave = 0;
  let timesBorrowed = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    switch (tx.direction) {
      case "I_GAVE":
        totalGiven += amount;
        timesGave++;
        break;
      case "I_BORROWED":
        totalBorrowed += amount;
        timesBorrowed++;
        break;
      case "THEY_REPAID":
        totalTheyRepaid += amount;
        break;
      case "I_REPAID":
        totalIRepaid += amount;
        break;
    }
  }

  const owedToMe = totalGiven - totalTheyRepaid;
  const iOwe = totalBorrowed - totalIRepaid;
  const net = owedToMe - iOwe;

  return {
    owedToMe: Math.max(0, owedToMe),
    iOwe: Math.max(0, iOwe),
    net,
    timesGave,
    timesBorrowed,
    totalGiven,
    totalBorrowed,
    totalTheyRepaid,
    totalIRepaid,
  };
}

/**
 * Determine the balance status label and direction.
 */
export function balanceLabel(net: number, currency: string, friendName: string): string {
  if (Math.abs(net) < 0.01) return "All settled";
  if (net > 0) return `${friendName} owes you`;
  return `You owe ${friendName}`;
}

export function balanceDirection(net: number): "owed-to-me" | "i-owe" | "settled" {
  if (Math.abs(net) < 0.01) return "settled";
  return net > 0 ? "owed-to-me" : "i-owe";
}

/**
 * Build the running balance column for a timeline.
 * Returns an array of { tx, runningBalance } in chronological order.
 */
export function buildTimeline<T extends LedgerTx & { date: Date | string }>(
  transactions: T[]
): Array<T & { runningBalance: number }> {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = 0;
  return sorted.map((tx) => {
    const amount = Number(tx.amount);
    switch (tx.direction) {
      case "I_GAVE":
        running += amount;
        break;
      case "I_BORROWED":
        running -= amount;
        break;
      case "THEY_REPAID":
        running -= amount;
        break;
      case "I_REPAID":
        running += amount;
        break;
    }
    return { ...tx, runningBalance: running };
  });
}

/**
 * Compute the settle-up amount and direction.
 * Returns { amount, direction } — the single transaction that would zero out the balance.
 */
export function settleUpTx(balance: FriendBalance): {
  amount: number;
  direction: LedgerDirection;
} {
  const { net } = balance;
  if (net > 0) {
    // Friend owes me → they should repay
    return { amount: net, direction: "THEY_REPAID" };
  } else {
    // I owe friend → I should repay
    return { amount: Math.abs(net), direction: "I_REPAID" };
  }
}
