import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LedgerTransactionSchema, ok, err } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const { id } = await params;

  const existing = await prisma.ledgerTransaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  const body = await req.json();
  const parsed = LedgerTransactionSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });

  const updated = await prisma.ledgerTransaction.update({
    where: { id },
    data: {
      ...(parsed.data.direction && { direction: parsed.data.direction }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.reason !== undefined && { reason: parsed.data.reason }),
      ...(parsed.data.dueDate !== undefined && {
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      }),
    },
  });

  return NextResponse.json(ok(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const { id } = await params;

  const existing = await prisma.ledgerTransaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  await prisma.ledgerTransaction.delete({ where: { id } });
  return NextResponse.json(ok({ deleted: true }));
}
