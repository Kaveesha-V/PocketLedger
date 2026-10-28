import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategorySchema, ok, err } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });

  const cats = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(ok(cats));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });

  const body = await req.json();
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });
  }

  const cat = await prisma.category.create({
    data: { userId: session.user.id, ...parsed.data },
  });
  return NextResponse.json(ok(cat), { status: 201 });
}
