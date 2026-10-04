import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Shield, Power, Eye, LogOut } from "lucide-react";

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session || !session.isRoot) {
    redirect("/");
  }

  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, sales: true, purchases: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Shield className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xl font-bold">Super Admin Console</h1>
        </div>
        <div className="flex items-center gap-4">
          <form action={async () => {
            "use server";
            (await cookies()).delete("viewingOrgId");
            redirect("/admin");
          }}>
            <button type="submit" className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors">
              Reset View
            </button>
          </form>
          <form action={async () => {
            "use server";
            (await cookies()).delete("session");
            redirect("/login");
          }}>
            <button type="submit" className="text-sm text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm">
              <tr>
                <th className="py-4 px-6 font-semibold">Organization Name</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Users</th>
                <th className="py-4 px-6 font-semibold">Transactions</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{org.name}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${org.isActive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                      {org.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-4 px-6">{org._count.users}</td>
                  <td className="py-4 px-6">{org._count.sales + org._count.purchases}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <form action={async () => {
                        "use server";
                        await prisma.organization.update({
                          where: { id: org.id },
                          data: { isActive: !org.isActive }
                        });
                        redirect("/admin");
                      }}>
                        <button type="submit" title={org.isActive ? "Suspend Account" : "Activate Account"} className={`p-2 rounded-lg transition-colors ${org.isActive ? "text-rose-400 hover:bg-rose-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}>
                          <Power className="w-4 h-4" />
                        </button>
                      </form>
                      
                      <form action={async () => {
                        "use server";
                        (await cookies()).set("viewingOrgId", org.id, { path: "/" });
                        redirect("/");
                      }}>
                        <button type="submit" title="View Dashboard" className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {organizations.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No organizations found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
