import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, ok } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(err("Email and OTP are required"), { status: 400 });
    }

    const record = await prisma.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(err("No verification code found. Please request a new one."), { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailOtp.delete({ where: { id: record.id } });
      return NextResponse.json(err("Verification code has expired. Please request a new one."), { status: 400 });
    }

    if (record.otp !== otp.trim()) {
      return NextResponse.json(err("Invalid verification code. Please try again."), { status: 400 });
    }

    // OTP is valid — clean up
    await prisma.emailOtp.deleteMany({ where: { email } });

    return NextResponse.json(ok({ verified: true }));
  } catch (e) {
    console.error("[verify-otp]", e);
    return NextResponse.json(err("Something went wrong. Please try again."), { status: 500 });
  }
}
