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

  let response = NextResponse.next();
  let refreshSuccessful = false;

  const refreshCookie = request.cookies.get("refresh")?.value;
  if (!decoded && refreshCookie && !path.startsWith("/api/auth")) {
    try {
      const res = await fetch(new URL("/api/auth/refresh", request.url), {
        method: "POST",
        headers: { "cookie": `refresh=${refreshCookie}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // We must clone the URL to avoid Next.js bugs with mutating request
        const url = request.nextUrl.clone();
        response = NextResponse.redirect(url);
        
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
        };
        response.cookies.set("session", data.session, { ...cookieOptions, maxAge: 15 * 60 });
        response.cookies.set("refresh", data.refresh, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });
        
        refreshSuccessful = true;
        // Since we are redirecting back to the same page with new cookies, 
        // we can just return this redirect immediately to start a fresh request.
        return response;
      }
    } catch (e) {
      console.error("Failed to refresh token", e);
    }
  }

  if (!isPublicPath && !decoded && !refreshSuccessful && !path.startsWith("/api/auth")) {
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
