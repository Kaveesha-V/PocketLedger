import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReminderEmailSchema, ok, err } from "@/lib/validators";
import { sendReminderEmail } from "@/lib/email";
import { calcBalance } from "@/lib/ledger";
import { formatCurrency, formatDate } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });

  const logs = await prisma.reminderLog.findMany({
    where: { userId: session.user.id },
    include: { friend: { select: { name: true } } },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  return NextResponse.json(ok(logs));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const parsed = ReminderEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json(err("User not found"), { status: 404 });

  const friend = await prisma.friend.findFirst({
    where: { id: parsed.data.friendId, userId },
    include: { transactions: true },
  });
  if (!friend) return NextResponse.json(err("Friend not found"), { status: 404 });

  if (!friend.email) {
    return NextResponse.json(err("Friend has no email address"), { status: 400 });
  }

  // Spam guard: warn if reminder sent within 24h
  const lastReminder = await prisma.reminderLog.findFirst({
    where: {
      userId,
      friendId: friend.id,
      channel: "EMAIL",
      sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (lastReminder) {
    return NextResponse.json(
      err("A reminder was already sent to this friend in the last 24 hours. Please wait before sending again."),
      { status: 429 }
    );
  }

  const balance = calcBalance(friend.transactions);
  const statement = friend.transactions.map((t) => ({
    date: formatDate(t.date, "short"),
    reason: t.reason ?? "—",
    amount: formatCurrency(Number(t.amount), user.currency),
    direction: t.direction.replace(/_/g, " "),
  }));

  const result = await sendReminderEmail({
    to: friend.email,
    friendName: friend.name,
    senderName: user.name,
    message: parsed.data.message,
    net: balance.net,
    currency: user.currency,
    statement,
  });

  const log = await prisma.reminderLog.create({
    data: {
      userId,
      friendId: friend.id,
      channel: "EMAIL",
      message: parsed.data.message,
      status: result.success ? "SENT" : "FAILED",
    },
  });

  if (!result.success) {
    return NextResponse.json(err(`Failed to send email: ${result.error}`), { status: 500 });
  }

  return NextResponse.json(ok(log), { status: 201 });
}
