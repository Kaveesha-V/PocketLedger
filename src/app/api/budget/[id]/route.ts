import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetEntryUpdateSchema, ok, err } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const body = await req.json();
  const parsed = BudgetEntryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });
  }

  const existing = await prisma.budgetEntry.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  const updated = await prisma.budgetEntry.update({
    where: { id },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.categoryId !== undefined && { categoryId: parsed.data.categoryId }),
      ...(parsed.data.type && { type: parsed.data.type }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.method !== undefined && { method: parsed.data.method }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
    },
    include: { category: { select: { id: true, name: true, color: true, icon: true } } },
  });

  return NextResponse.json(ok(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const existing = await prisma.budgetEntry.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  await prisma.budgetEntry.delete({ where: { id } });
  return NextResponse.json(ok({ deleted: true }));
}
