import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { parseTemplates } from "@/lib/messages";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "export") {
    // Export all data belonging to the user
    const [user, budgets, categories, friends, transactions, reminders] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            currency: true,
            theme: true,
            createdAt: true,
          },
        }),
        prisma.budgetEntry.findMany({
          where: { userId: session.user.id },
          include: { category: true },
        }),
        prisma.category.findMany({
          where: { userId: session.user.id },
        }),
        prisma.friend.findMany({
          where: { userId: session.user.id },
        }),
        prisma.ledgerTransaction.findMany({
          where: { userId: session.user.id },
        }),
        prisma.reminderLog.findMany({
          where: { userId: session.user.id },
        }),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      categories,
      budgets,
      friends,
      transactions,
      reminders,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="PocketLedger_Export_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // Normal profile fetch
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      currency: true,
      theme: true,
      reminderTemplates: true,
    },
  });

  if (!user) {
    return NextResponse.json(err("User not found"), { status: 404 });
  }

  return NextResponse.json(
    ok({
      ...user,
      reminderTemplates: parseTemplates(user.reminderTemplates),
    })
  );
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      updateData.phone = body.phone.trim();
    }
    if (typeof body.currency === "string") {
      updateData.currency = body.currency;
    }
    if (body.theme === "light" || body.theme === "dark") {
      updateData.theme = body.theme;
    }
    if (body.reminderTemplates && typeof body.reminderTemplates === "object") {
      updateData.reminderTemplates = JSON.stringify(body.reminderTemplates);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json(
      ok({
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        currency: updatedUser.currency,
        theme: updatedUser.theme,
      })
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update settings";
    return NextResponse.json(err(msg), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.action === "change-password") {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return NextResponse.json(
          err("New password must be at least 8 characters"),
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          err("Cannot change password for social login accounts"),
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(err("Current password is incorrect"), {
          status: 400,
        });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json(ok({ message: "Password updated successfully" }));
    }

    return NextResponse.json(err("Unknown action"), { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to process request";
    return NextResponse.json(err(msg), { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Delete in sequence to respect foreign keys
    await prisma.$transaction([
      prisma.reminderLog.deleteMany({ where: { userId } }),
      prisma.ledgerTransaction.deleteMany({ where: { userId } }),
      prisma.friend.deleteMany({ where: { userId } }),
      prisma.budgetEntry.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json(ok({ message: "Account deleted permanently" }));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete account";
    return NextResponse.json(err(msg), { status: 500 });
  }
}
