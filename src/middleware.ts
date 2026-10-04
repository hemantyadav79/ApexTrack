import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/login" || path === "/register";
  
  const session = request.cookies.get("session")?.value;
  let decoded = null;
  
  if (session) {
    try {
      decoded = await decrypt(session);
    } catch (e) {
      decoded = null;
    }
  }

  if (!isPublicPath && !decoded && !path.startsWith("/api/auth")) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicPath && decoded) {
    if (decoded.isRoot) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If root user tries to access normal app without a viewingOrgId, force them to /admin
  const viewingOrgId = request.cookies.get("viewingOrgId")?.value;
  if (decoded?.isRoot && !viewingOrgId && path !== "/admin" && !path.startsWith("/api")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
