import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";
import { err, ok } from "@/lib/validators";

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(err("Email is required"), { status: 400 });
    }

    // Rate limit: check for a recent OTP (created within last 60 seconds)
    const recent = await prisma.emailOtp.findFirst({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });
    if (recent) {
      return NextResponse.json(
        err("Please wait 60 seconds before requesting a new code"),
        { status: 429 }
      );
    }

    // Delete any existing OTPs for this email
    await prisma.emailOtp.deleteMany({ where: { email } });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailOtp.create({ data: { email, otp, expiresAt } });

    const result = await sendOtpEmail(email, otp);

    if (!result.success) {
      // If email service isn't configured, still return success in dev
      // but log the OTP for testing
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        return NextResponse.json(ok({ sent: true, devOtp: otp }));
      }
      return NextResponse.json(err("Failed to send OTP email. Please try again."), { status: 500 });
    }

    return NextResponse.json(ok({ sent: true }));
  } catch (e) {
    console.error("[send-otp]", e);
    return NextResponse.json(err("Something went wrong. Please try again."), { status: 500 });
  }
}
