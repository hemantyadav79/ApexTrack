"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerSchema } from "@/lib/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, ShoppingCart } from "lucide-react";

type CustomerFormValues = z.infer<typeof CustomerSchema>;

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      name: "",
      contactInfo: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add customer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      form.reset();
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  function onSubmit(values: CustomerFormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Customer Management
          </h2>
          <p className="text-slate-500 mt-1">Manage your clients and accounts receivable history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add Customer Form */}
          <div className="lg:col-span-5">
            <Card className="shadow-lg border-slate-200/80 bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-900">Add New Customer</CardTitle>
                <CardDescription>Register a new client.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700">Customer Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Downtown Cafe" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700">Contact Info (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Email or Phone Number" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {mutation.isPending ? "Adding..." : "Add Customer"}
                    </button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Customers List */}
          <div className="lg:col-span-7">
            <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden h-full flex flex-col">
              <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg font-bold text-slate-900">Registered Customers</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <p className="text-slate-500">Loading customers...</p>
                ) : customers && customers.length > 0 ? (
                  <div className="space-y-3">
                    {customers.map((c: any) => (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          {c.contactInfo && (
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <Phone className="w-3.5 h-3.5" /> {c.contactInfo}
                            </p>
                          )}
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-slate-400" />
                          {c._count.sales} Sales Logged
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>No customers registered yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
