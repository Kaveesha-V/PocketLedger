import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategorySchema, ok, err } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const { id } = await params;

  const existing = await prisma.category.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  const body = await req.json();
  const parsed = CategorySchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });

  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(ok(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const { id } = await params;

  const existing = await prisma.category.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json(ok({ deleted: true }));
}
