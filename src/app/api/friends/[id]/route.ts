import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FriendSchema, ok, err } from "@/lib/validators";
import { calcBalance, buildTimeline } from "@/lib/ledger";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const friend = await prisma.friend.findFirst({
    where: { id, userId },
    include: {
      transactions: { orderBy: { date: "asc" } },
      reminders: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!friend) return NextResponse.json(err("Friend not found"), { status: 404 });

  const balance = calcBalance(friend.transactions);
  const timeline = buildTimeline(
    friend.transactions.map((t) => ({ ...t, amount: Number(t.amount) }))
  );

  return NextResponse.json(
    ok({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      phone: friend.phone,
      note: friend.note,
      archived: friend.archived,
      balance,
      timeline: timeline.map((t) => ({
        id: t.id,
        direction: t.direction,
        amount: Number(t.amount),
        date: t.date,
        reason: t.reason,
        dueDate: t.dueDate,
        settled: t.settled,
        runningBalance: t.runningBalance,
      })),
      reminders: friend.reminders,
    })
  );
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const { id } = await params;

  const existing = await prisma.friend.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  const body = await req.json();
  const parsed = FriendSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });

  const updated = await prisma.friend.update({ where: { id }, data: parsed.data });
  return NextResponse.json(ok(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const { id } = await params;

  const existing = await prisma.friend.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  // Archive instead of hard delete
  await prisma.friend.update({ where: { id }, data: { archived: true } });
  return NextResponse.json(ok({ archived: true }));
}
