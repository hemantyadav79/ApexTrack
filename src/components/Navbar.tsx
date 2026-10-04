"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  
  const navLinks = [
    { name: "Materials", href: "/materials" },
    { name: "Products & BOM", href: "/products" },
    { name: "Purchases", href: "/purchases" },
    { name: "Production", href: "/production" },
    { name: "Sales", href: "/sales" },
  ];

  return (
    <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between shadow-lg sticky top-0 z-50 gap-3">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-3">
          {pathname !== "/" && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700/60"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          {pathname !== "/" && <div className="hidden sm:block h-5 w-px bg-slate-700" />}
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">ApexTrack</h1>
            <p className="text-[10px] sm:text-xs text-slate-400">Inventory & P&L Tracker</p>
          </div>
        </div>
        
        {/* Logout button moved here for mobile layout */}
        <button 
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="logout-btn text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg md:hidden"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
        <nav className="flex items-center gap-1 sm:gap-2 flex-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? "font-medium bg-slate-800 text-white"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="h-5 w-px bg-slate-700 hidden md:block" />
        
        <button 
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="logout-btn text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg hidden md:block"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
