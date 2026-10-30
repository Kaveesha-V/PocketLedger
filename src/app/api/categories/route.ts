import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategorySchema, ok, err } from "@/lib/validators";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;

  let cats = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // If the user has no categories (e.g. signed up via Google OAuth), auto-seed default categories
  if (cats.length === 0) {
    try {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          userId,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
        })),
        skipDuplicates: true,
      });

      cats = await prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });
    } catch (e) {
      console.error("Failed to auto-seed categories:", e);
    }
  }

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
