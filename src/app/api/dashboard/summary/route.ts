import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcBalance } from "@/lib/ledger";
import { ok, err } from "@/lib/validators";
import { getMonthRange } from "@/lib/format";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(err("Unauthorized"), { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // YYYY-MM
    const now = new Date();
    const year = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam.split("-")[1]) : now.getMonth() + 1;
    const { start, end } = getMonthRange(year, month);

    // Budget summary for the month
    const entries = await prisma.budgetEntry.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        title: true,
        category: { select: { name: true, color: true, icon: true } },
      },
      orderBy: { date: "asc" },
    });

    const totalIncome = entries
      .filter((e) => e.type === "INCOME")
      .reduce((s, e) => s + Number(e.amount), 0);
    const totalExpense = entries
      .filter((e) => e.type === "EXPENSE")
      .reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalIncome - totalExpense;

    // Category breakdown
    const categoryMap: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
    for (const e of entries.filter((e) => e.type === "EXPENSE")) {
      const key = e.category?.name ?? "Other";
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: key,
          color: e.category?.color ?? "#6b7f77",
          icon: e.category?.icon ?? "📦",
          amount: 0,
        };
      }
      categoryMap[key].amount += Number(e.amount);
    }
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

    // Daily spending
    const dailyMap: Record<string, number> = {};
    for (const e of entries.filter((e) => e.type === "EXPENSE")) {
      const day = new Date(e.date).toISOString().split("T")[0];
      dailyMap[day] = (dailyMap[day] ?? 0) + Number(e.amount);
    }
    const dailySpending = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // Friends summary
    const friends = await prisma.friend.findMany({
      where: { userId, archived: false },
      include: {
        transactions: { select: { direction: true, amount: true, settled: true, date: true } },
      },
    });

    let totalOwedToMe = 0;
    let totalIOwe = 0;
    let friendsOwingMe = 0;
    let friendsIowe = 0;

    const friendSummaries = friends.map((f) => {
      const bal = calcBalance(f.transactions);
      if (bal.net > 0.01) {
        totalOwedToMe += bal.net;
        friendsOwingMe++;
      }
      if (bal.net < -0.01) {
        totalIOwe += Math.abs(bal.net);
        friendsIowe++;
      }
      const lastTx = f.transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      return {
        id: f.id,
        name: f.name,
        net: bal.net,
        lastDate: lastTx?.date ?? null,
      };
    });

    // Top pending by absolute balance
    const top5 = friendSummaries
      .filter((f) => Math.abs(f.net) > 0.01)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
      .slice(0, 6);

    // Overdue ledger items
    const overdue = await prisma.ledgerTransaction.findMany({
      where: {
        userId,
        settled: false,
        dueDate: { lt: new Date() },
      },
      include: { friend: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    });

    // Recent 6 ledger transactions
    const recentLedger = await prisma.ledgerTransaction.findMany({
      where: { userId },
      include: { friend: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 6,
    });

    // Recent budget entries
    const recentBudget = entries
      .slice(-8)
      .reverse()
      .map((e) => ({
        id: e.id,
        type: "budget" as const,
        title: e.title,
        amount: Number(e.amount),
        entryType: e.type,
        date: e.date,
        category: e.category?.name ?? null,
      }));

    return NextResponse.json(
      ok({
        month: `${year}-${String(month).padStart(2, "0")}`,
        budget: { totalIncome, totalExpense, balance },
        friends: {
          totalOwedToMe,
          totalIOwe,
          friendsOwingMe,
          friendsIowe,
          top5,
        },
        categoryBreakdown,
        dailySpending,
        recentActivity: recentBudget,
        recentLedger: recentLedger.map((l) => ({
          id: l.id,
          friendId: l.friend.id,
          friendName: l.friend.name,
          direction: l.direction,
          amount: Number(l.amount),
          date: l.date,
          reason: l.reason,
          settled: l.settled,
        })),
        overdue: overdue.map((o) => ({
          id: o.id,
          friendName: o.friend.name,
          friendId: o.friend.id,
          amount: Number(o.amount),
          direction: o.direction,
          dueDate: o.dueDate,
          reason: o.reason,
        })),
      })
    );
  } catch (e) {
    console.error("[dashboard-summary]", e);
    return NextResponse.json(err("Failed to load dashboard summary"), { status: 500 });
  }
}
