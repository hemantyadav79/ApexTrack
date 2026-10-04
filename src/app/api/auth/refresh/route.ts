import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshMatch = cookieHeader.match(/refresh=([^;]+)/);
    const refreshTokenValue = refreshMatch ? refreshMatch[1] : null;

    if (!refreshTokenValue) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Find token in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true }
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      // If invalid or expired, delete it if it exists
      if (dbToken) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      }
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    const { user } = dbToken;

    // Issue new access token
    const newSession = await encrypt({ 
      userId: user.id, 
      email: user.email, 
      orgId: user.organizationId, 
      isRoot: user.isRoot 
    }, "15m");

    // Rotate refresh token for added security (optional, but good practice)
    const newRefreshToken = crypto.randomUUID();
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({ 
      session: newSession, 
      refresh: newRefreshToken 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
