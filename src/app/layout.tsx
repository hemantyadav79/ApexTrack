import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexTrack Dashboard",
  description: "Business Tracking Inventory and P&L Dashboard",
};

import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let isActive = true;
  if (session) {
    const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
    if (org && !org.isActive) isActive = false;
  }

  const viewingOrgId = session?.isRoot ? (await import("next/headers")).cookies().then(c => c.get("viewingOrgId")?.value) : null;
  const isViewingOrg = await viewingOrgId;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${!isActive ? 'overflow-hidden' : ''}`}
    >
      <body className={`min-h-full flex flex-col bg-slate-50 text-slate-900 ${!isActive ? 'inactive-account grayscale' : ''}`}>
        {isViewingOrg && (
          <div className="bg-emerald-600 text-white text-sm py-1.5 px-4 flex justify-between items-center z-[100] sticky top-0 relative">
            <span className="font-medium">Viewing as Organization (Root Mode)</span>
            <form action={async () => {
              "use server";
              const { cookies } = await import("next/headers");
              const { redirect } = await import("next/navigation");
              (await cookies()).delete("viewingOrgId");
              redirect("/admin");
            }}>
              <button type="submit" className="text-xs bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded transition-colors border border-emerald-500">
                Return to Admin Console
              </button>
            </form>
          </div>
        )}

        {!isActive && (
          <div className="bg-rose-600 text-white text-sm py-1.5 px-4 flex justify-center items-center z-[100] sticky top-0 relative shadow-md">
            <span className="font-semibold tracking-wide">ACCOUNT SUSPENDED. ALL ACTIONS ARE DISABLED.</span>
          </div>
        )}
        
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
