"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const COLORS = ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2"];

interface DashboardData {
  totalInvested: number;
  totalRevenue: number;
  netProfit: number;
  expensesBreakdown: { name: string; value: number }[];
  stockLevels: { name: string; stock: number; unit: string }[];
  revenueVsExpenses: { date: string; revenue: number; expense: number }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    date: string;
    quantity: number;
    cashFlow: number;
    status: string;
  }[];
}

export function DashboardCharts({ data }: { data: DashboardData | undefined }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  if (!data) return null;

  // Filter recent activity based on state
  const filteredActivity = data.recentActivity.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full flex flex-col gap-6 pt-8">
      {/* Chart Row 1: Area Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue vs Expenses Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueVsExpenses} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(val) => format(new Date(val), "MMM dd")} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#DC2626" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Expense Breakdown</h2>
          <div className="h-72 flex flex-col items-center justify-center">
            {data.expensesBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.expensesBreakdown} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {data.expensesBreakdown.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm">No purchases yet</p>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {data.expensesBreakdown.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Row 2: Horizontal Bar Chart */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Live Stock Levels</h2>
        <div className="h-72">
          {data.stockLevels.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockLevels} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={150} />
                <Tooltip formatter={(value, _name, props) => [`${value} ${props.payload.unit}`, "Stock"]} />
                <Bar dataKey="stock" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-20">No materials registered yet</p>
          )}
        </div>
      </div>

      {/* Recent Activity Ledger Table */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Activity Ledger</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search description..."
                className="pl-9 bg-slate-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Sale">Sales</option>
              <option value="Purchase">Purchases</option>
              <option value="Production">Production</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] rounded-md border border-slate-100">
          {filteredActivity.length > 0 ? (
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-sm">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Cash Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivity.map((activity) => (
                  <tr key={`${activity.type}-${activity.id}`} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        activity.type === "Sale" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                        activity.type === "Purchase" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                        "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{activity.title}</td>
                    <td className="py-3 px-4 text-slate-500">{format(new Date(activity.date), "MMM dd, yyyy")}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{activity.quantity}</td>
                    <td className={`py-3 px-4 text-right font-bold tabular-nums ${
                      activity.cashFlow > 0 ? "text-emerald-600" :
                      activity.cashFlow < 0 ? "text-rose-600" :
                      "text-slate-400"
                    }`}>
                      {activity.cashFlow > 0
                        ? `+₹${activity.cashFlow.toLocaleString("en-IN")}`
                        : activity.cashFlow < 0
                        ? `-₹${Math.abs(activity.cashFlow).toLocaleString("en-IN")}`
                        : "₹0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No activity found matching your filters.</p>
              <button 
                onClick={() => { setSearchTerm(""); setFilterType("All"); }}
                className="mt-2 text-blue-600 text-sm font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
