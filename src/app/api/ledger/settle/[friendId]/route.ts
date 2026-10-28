import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/validators";
import { calcBalance, settleUpTx } from "@/lib/ledger";

/**
 * POST /api/ledger/settle/:friendId
 * Creates a settling transaction and marks all as settled.
 */
export async function POST(req: Request, { params }: { params: Promise<{ friendId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;
  const { friendId } = await params;

  const friend = await prisma.friend.findFirst({
    where: { id: friendId, userId },
    include: { transactions: true },
  });
  if (!friend) return NextResponse.json(err("Friend not found"), { status: 404 });

  const balance = calcBalance(friend.transactions);

  if (Math.abs(balance.net) < 0.01) {
    return NextResponse.json(ok({ message: "Already settled", net: 0 }));
  }

  const { amount, direction } = settleUpTx(balance);

  // Create settle-up transaction
  const tx = await prisma.ledgerTransaction.create({
    data: {
      userId,
      friendId,
      direction,
      amount,
      date: new Date(),
      reason: "Settle up",
      settled: true,
    },
  });

  // Mark all previous transactions as settled
  await prisma.ledgerTransaction.updateMany({
    where: { userId, friendId, settled: false },
    data: { settled: true },
  });

  return NextResponse.json(ok({ tx, message: "All settled ✅" }));
}
