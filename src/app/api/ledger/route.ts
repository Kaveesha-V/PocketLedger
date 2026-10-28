import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LedgerTransactionSchema, ok, err } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const parsed = LedgerTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });
  }

  // Ensure friend belongs to this user
  const friend = await prisma.friend.findFirst({
    where: { id: parsed.data.friendId, userId },
  });
  if (!friend) return NextResponse.json(err("Friend not found"), { status: 404 });

  const tx = await prisma.ledgerTransaction.create({
    data: {
      userId,
      friendId: parsed.data.friendId,
      direction: parsed.data.direction,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      reason: parsed.data.reason ?? null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  return NextResponse.json(ok(tx), { status: 201 });
}
