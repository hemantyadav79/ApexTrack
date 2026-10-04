import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [purchases, sales, materials, productionLogs] = await Promise.all([
      prisma.purchase.findMany({ 
        where: { organizationId: session.orgId },
        include: { material: true, supplier: true } 
      }),
      prisma.sale.findMany({ 
        where: { organizationId: session.orgId },
        include: { customer: true }
      }),
      prisma.material.findMany({ where: { organizationId: session.orgId } }),
      prisma.productionLog.findMany({ where: { organizationId: session.orgId } }),
    ]);

    // Low stock items
    const lowStockItems = materials.filter(m => m.currentStock <= m.minStockThreshold);

    // Rule C: P&L Calculation
    const totalInvested = purchases.reduce((sum, p) => sum + p.totalCost, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalSellingPrice, 0);
    const netProfit = totalRevenue - totalInvested;

    // Expense breakdown by material
    const expensesMap: Record<string, number> = {};
    purchases.forEach((p) => {
      const name = p.material.name;
      expensesMap[name] = (expensesMap[name] || 0) + p.totalCost;
    });
    const expensesBreakdown = Object.keys(expensesMap).map((key) => ({
      name: key,
      value: expensesMap[key],
    }));

    // Stock levels
    const stockLevels = materials.map((m) => ({
      name: m.name,
      stock: m.currentStock,
      unit: m.unit,
    }));

    // Revenue vs Expenses over time (grouped by day)
    const timeMap: Record<string, { date: string; revenue: number; expense: number }> = {};

    sales.forEach((s) => {
      const d = new Date(s.date).toISOString().split("T")[0];
      if (!timeMap[d]) timeMap[d] = { date: d, revenue: 0, expense: 0 };
      timeMap[d].revenue += s.totalSellingPrice;
    });

    purchases.forEach((p) => {
      const d = new Date(p.date).toISOString().split("T")[0];
      if (!timeMap[d]) timeMap[d] = { date: d, revenue: 0, expense: 0 };
      timeMap[d].expense += p.totalCost;
    });

    const revenueVsExpenses = Object.values(timeMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Recent activity ledger
    const recentActivity = [
      ...sales.map((s: any) => ({
        id: s.id,
        type: "Sale" as const,
        title: s.customer ? `${s.productName} (to ${s.customer.name})` : s.productName,
        date: s.date,
        quantity: s.quantitySold,
        cashFlow: s.totalSellingPrice,
        status: "Settled",
      })),
      ...purchases.map((p: any) => ({
        id: p.id,
        type: "Purchase" as const,
        title: p.supplier ? `${p.material.name} (from ${p.supplier.name})` : p.material.name,
        date: p.date,
        quantity: p.quantity,
        cashFlow: -p.totalCost,
        status: "Settled",
      })),
      ...productionLogs.map((p) => ({
        id: p.id,
        type: "Production" as const,
        title: p.productName,
        date: p.date,
        quantity: p.quantityProduced,
        cashFlow: 0,
        status: "Completed",
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalInvested,
      totalRevenue,
      netProfit,
      expensesBreakdown,
      stockLevels,
      revenueVsExpenses,
      recentActivity,
      lowStockItems,
      isRoot: session.isRoot,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
