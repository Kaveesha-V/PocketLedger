import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  const logs = await prisma.reminderLog.findMany({
    where: { userId: session.user.id },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  return NextResponse.json(ok(logs));
}
