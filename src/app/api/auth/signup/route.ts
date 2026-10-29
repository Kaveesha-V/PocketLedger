import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignupSchema, ok, err } from "@/lib/validators";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Require OTP verification token in the request
    const { otpVerified, ...signupData } = body;

    if (!otpVerified) {
      return NextResponse.json(err("Email verification is required before creating an account"), { status: 400 });
    }

    const parsed = SignupSchema.safeParse(signupData);

    if (!parsed.success) {
      const issues = parsed.error?.issues ?? parsed.error?.errors ?? [];
      return NextResponse.json(err(issues[0]?.message ?? "Validation error"), { status: 400 });
    }

    const { name, email, password, phone, currency } = parsed.data;

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(err("An account with this email already exists"), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with emailVerified set since OTP confirmed
    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: new Date(),
        passwordHash,
        phone: phone || null,
        currency: currency || "LKR",
      },
    });

    // Seed default categories
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        userId: user.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
      })),
    });

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(email, name).catch(console.error);

    return NextResponse.json(ok({ id: user.id, email: user.email }), { status: 201 });
  } catch (e) {
    console.error("[signup]", e);
    return NextResponse.json(err("Something went wrong. Please try again."), { status: 500 });
  }
}
