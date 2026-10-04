import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AuthSchema } from "@/lib/schema";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, organizationName } = body;
    
    if (!organizationName) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const parsed = AuthSchema.safeParse({ email, password });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: organizationName },
      });
      return await tx.user.create({
        data: { email, passwordHash, organizationId: org.id },
      });
    });

    const session = await encrypt({ userId: user.id, email: user.email, orgId: user.organizationId });
    const cookieStore = await cookies();
    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ message: "Registered successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
