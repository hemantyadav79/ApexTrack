"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Navbar } from "@/components/Navbar";
import {
  DollarSign, TrendingUp, TrendingDown, Package,
  ShoppingCart, Factory, Receipt, IndianRupee, Download
} from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });

  const netProfit = data?.netProfit ?? 0;
  const isProfit = netProfit >= 0;

  const handleExportPDF = () => {
    if (!data) return;
    
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then(({ default: autoTable }) => {
        const doc = new jsPDF.default();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42);
        doc.text("ApexTrack Executive Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
        
        // Summary Cards
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Financial Summary", 14, 45);
        
        // A mini-table for summary
        autoTable(doc, {
          startY: 50,
          head: [['Total Invested', 'Total Revenue', 'Net Profit', 'Active Materials']],
          body: [[
            `Rs. ${data.totalInvested.toLocaleString("en-IN")}`,
            `Rs. ${data.totalRevenue.toLocaleString("en-IN")}`,
            `Rs. ${data.netProfit.toLocaleString("en-IN")}`,
            `${data.stockLevels.length}`
          ]],
          theme: 'grid',
          headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
          bodyStyles: { fontStyle: 'bold', fontSize: 12 }
        });
        
        // Recent Activity
        doc.setFontSize(14);
        doc.text("Recent Activity Ledger", 14, (doc as any).lastAutoTable.finalY + 15);
        
        const tableData = data.recentActivity.map((act: any) => [
          act.type,
          act.title,
          new Date(act.date).toLocaleDateString(),
          act.quantity.toString(),
          act.cashFlow > 0 ? `+Rs. ${act.cashFlow.toLocaleString("en-IN")}` : act.cashFlow < 0 ? `-Rs. ${Math.abs(act.cashFlow).toLocaleString("en-IN")}` : "Rs. 0"
        ]);
        
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Type', 'Description', 'Date', 'Quantity', 'Cash Flow']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42] }
        });
        
        doc.save(`ApexTrack_Report_${new Date().getTime()}.pdf`);
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      {/* Top Navigation Bar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title & Actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-200/60 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-80 bg-slate-200/60 rounded-xl lg:col-span-2"></div>
              <div className="h-80 bg-slate-200/60 rounded-xl"></div>
            </div>
            <div className="h-96 bg-slate-200/60 rounded-xl"></div>
          </div>
        ) : (
          <>
            {/* Low Stock Alerts */}
            {data?.lowStockItems && data.lowStockItems.length > 0 && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-800">Low Stock Alert</h3>
                  <p className="text-sm text-rose-700 mt-1">
                    {data.lowStockItems.length} material{data.lowStockItems.length > 1 ? "s" : ""} {data.lowStockItems.length > 1 ? "are" : "is"} running low and below their minimum threshold:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.lowStockItems.map((m: any) => (
                      <Link href="/materials" key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
                        {m.name} 
                        <span className="text-rose-500 font-normal">({m.currentStock} {m.unit} left)</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Invested */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/50 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-4 relative">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Invested</span>
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
                <IndianRupee className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums relative">
              {formatCurrency(data?.totalInvested ?? 0)}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-4 relative">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums relative">
              {formatCurrency(data?.totalRevenue ?? 0)}
            </p>
          </div>

          {/* Net Profit/Loss */}
          <div className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${isProfit ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200" : "bg-gradient-to-br from-rose-50 to-white border-rose-200"}`}>
             <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 ${isProfit ? "bg-gradient-to-br from-emerald-200/40 to-transparent" : "bg-gradient-to-br from-rose-200/40 to-transparent"}`} />
            <div className="flex items-center justify-between mb-4 relative">
              <span className={`text-sm font-semibold uppercase tracking-wider ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
                Net {isProfit ? "Profit" : "Loss"}
              </span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isProfit ? "bg-emerald-100/50 border-emerald-200" : "bg-rose-100/50 border-rose-200"}`}>
                {isProfit
                  ? <TrendingUp className="w-5 h-5 text-emerald-700" />
                  : <TrendingDown className="w-5 h-5 text-rose-700" />}
              </div>
            </div>
            <p className={`text-3xl font-bold tabular-nums relative ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
              {isProfit ? "+" : "-"}{formatCurrency(Math.abs(netProfit))}
            </p>
          </div>

          {/* Active SKUs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-4 relative">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Materials</span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums relative">
              {data?.stockLevels?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/purchases" className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Log Purchase</p>
                <p className="text-xs text-slate-500">Record incoming raw materials</p>
              </div>
            </Link>

            <Link href="/production" className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Log Production</p>
                <p className="text-xs text-slate-500">Convert raw stock into finished goods</p>
              </div>
            </Link>

            <Link href="/sales" className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Log Sale</p>
                <p className="text-xs text-slate-500">Record revenue from clients</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Charts & Ledger */}
        <DashboardCharts data={data} />
        </>
        )}
      </main>
    </div>
  );
}
