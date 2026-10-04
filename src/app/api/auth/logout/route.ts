import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshCookie = cookieStore.get("refresh")?.value;

    if (refreshCookie) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshCookie }
      });
    }

    cookieStore.set("session", "", { expires: new Date(0) });
    cookieStore.set("refresh", "", { expires: new Date(0) });
    cookieStore.set("viewingOrgId", "", { expires: new Date(0) });

    return NextResponse.json({ message: "Logged out" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
