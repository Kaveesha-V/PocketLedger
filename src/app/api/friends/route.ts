import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FriendSchema, ok, err } from "@/lib/validators";
import { calcBalance } from "@/lib/ledger";
import { normalizePhoneNumber } from "@/lib/messages";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get("archived") === "true";

  const friends = await prisma.friend.findMany({
    where: { userId, archived: showArchived ? undefined : false },
    include: {
      transactions: { select: { direction: true, amount: true, settled: true, date: true, dueDate: true } },
      reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const result = friends.map((f) => {
    const balance = calcBalance(f.transactions);
    const lastTx = f.transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return {
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.phone,
      note: f.note,
      archived: f.archived,
      balance,
      txCount: f.transactions.length,
      lastActivity: lastTx?.date ?? null,
      lastReminder: f.reminders[0]?.sentAt ?? null,
    };
  });

  return NextResponse.json(ok(result));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });

  const body = await req.json();
  const parsed = FriendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });
  }

  const rawPhone = parsed.data.phone?.trim();
  const phone = rawPhone ? normalizePhoneNumber(rawPhone) : null;

  const friend = await prisma.friend.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name.trim(),
      email: parsed.data.email?.trim() || null,
      phone,
      note: parsed.data.note?.trim() || null,
    },
  });

  const result = {
    id: friend.id,
    name: friend.name,
    email: friend.email,
    phone: friend.phone,
    note: friend.note,
    archived: friend.archived,
    balance: {
      net: 0,
      timesGave: 0,
      timesBorrowed: 0,
      totalGave: 0,
      totalBorrowed: 0,
      totalTheyRepaid: 0,
      totalIRepaid: 0,
    },
    txCount: 0,
    lastActivity: null,
    lastReminder: null,
  };

  return NextResponse.json(ok(result), { status: 201 });
}
