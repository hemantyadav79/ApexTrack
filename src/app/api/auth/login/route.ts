import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AuthSchema } from "@/lib/schema";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await request.json();
    const parsed = AuthSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { email, password } = parsed.data;

    // Progressive Rate Limiting (Exponential Backoff)
    const now = Date.now();
    const fifteenMinsAgo = new Date(now - 15 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [fails15m, fails1h, fails1d] = await Promise.all([
      prisma.loginAttempt.count({ where: { ip, success: false, timestamp: { gte: fifteenMinsAgo } } }),
      prisma.loginAttempt.count({ where: { ip, success: false, timestamp: { gte: oneHourAgo } } }),
      prisma.loginAttempt.count({ where: { ip, success: false, timestamp: { gte: oneDayAgo } } })
    ]);

    if (fails1d >= 20) {
      return NextResponse.json({ error: "IP banned for 24 hours due to extreme suspicious activity." }, { status: 429 });
    }
    if (fails1h >= 10) {
      return NextResponse.json({ error: "Too many failed attempts. Account locked for 1 hour." }, { status: 429 });
    }
    if (fails15m >= 5) {
      return NextResponse.json({ error: "Too many failed attempts. Please wait 15 minutes." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await prisma.loginAttempt.create({ data: { ip, email, success: false } });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await prisma.loginAttempt.create({ data: { ip, email, success: false } });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Success! Record it.
    await prisma.loginAttempt.create({ data: { ip, email, success: true } });

    // 1. Short-Lived Access Token (15 mins)
    const session = await encrypt({ 
      userId: user.id, 
      email: user.email, 
      orgId: user.organizationId, 
      isRoot: user.isRoot 
    }, "15m");

    // 2. Long-Lived Refresh Token (7 days)
    const refreshToken = crypto.randomUUID();
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    cookieStore.set("session", session, { ...cookieOptions, maxAge: 15 * 60 });
    cookieStore.set("refresh", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });

    return NextResponse.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
