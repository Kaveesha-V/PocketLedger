import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReminderWhatsappSchema, ok, err } from "@/lib/validators";

/**
 * POST /api/reminders/whatsapp-log
 * Logs a WhatsApp reminder after the user clicked the wa.me link.
 * (Phase 1: click-to-chat, no API needed)
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(err("Unauthorized"), { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const parsed = ReminderWhatsappSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(err(parsed.error.errors[0].message), { status: 400 });
  }

  const friend = await prisma.friend.findFirst({
    where: { id: parsed.data.friendId, userId },
  });
  if (!friend) return NextResponse.json(err("Friend not found"), { status: 404 });

  const log = await prisma.reminderLog.create({
    data: {
      userId,
      friendId: friend.id,
      channel: "WHATSAPP",
      message: parsed.data.message,
      status: "SENT", // Optimistically logged; user opened the wa.me link
    },
  });

  return NextResponse.json(ok(log), { status: 201 });
}
