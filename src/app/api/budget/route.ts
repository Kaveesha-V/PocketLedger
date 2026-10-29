import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetEntrySchema, ok, err } from "@/lib/validators";
import { getMonthRange } from "@/lib/format";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const now = new Date();
    const year = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam.split("-")[1]) : now.getMonth() + 1;
    const { start, end } = getMonthRange(year, month);

    const entries = await prisma.budgetEntry.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(ok(entries));
  } catch (e) {
    console.error("[budget-get]", e);
    return NextResponse.json(err("Failed to load budget entries"), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
    const userId = session.user.id;

    const body = await req.json();
    const parsed = BudgetEntrySchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error.errors ?? [];
      return NextResponse.json(err(issues[0]?.message ?? "Validation error"), { status: 400 });
    }

    const entry = await prisma.budgetEntry.create({
      data: {
        userId,
        date: new Date(parsed.data.date),
        title: parsed.data.title,
        categoryId: parsed.data.categoryId ?? null,
        type: parsed.data.type,
        amount: parsed.data.amount,
        method: parsed.data.method ?? null,
        note: parsed.data.note ?? null,
      },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });

    return NextResponse.json(ok(entry), { status: 201 });
  } catch (e) {
    console.error("[budget-post]", e);
    return NextResponse.json(err("Failed to create budget entry"), { status: 500 });
  }
}
