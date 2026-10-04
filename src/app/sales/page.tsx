"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaleSchema } from "@/lib/schema";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";

type SaleFormValues = z.infer<typeof SaleSchema>;

export default function SalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      return res.json();
    },
  });

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(SaleSchema),
    defaultValues: {
      productId: "",
      quantitySold: 1,
      totalSellingPrice: 0,
      customerId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SaleFormValues) => {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log sale");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset();
      router.push("/");
    },
  });

  function onSubmit(values: SaleFormValues) {
    mutation.mutate(values);
  }

  const quantitySoldValue = form.watch("quantitySold");
  const totalSellingPriceValue = form.watch("totalSellingPrice");
  const unitSellingPrice =
    quantitySoldValue > 0 && totalSellingPriceValue > 0
      ? (totalSellingPriceValue / quantitySoldValue).toFixed(2)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 sm:p-8 max-w-4xl flex-1 flex flex-col justify-center">
        <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-green-400" />
          <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-700 border border-emerald-200 shadow-xs shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Log Sales Order
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Record sales revenue, track customer order volume, and update financial metrics in INR (₹).
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Select Product
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full h-11 bg-white border-slate-200">
                                <SelectValue placeholder="Choose a product...">
                                  {products?.find((p: any) => p.id === field.value)?.name}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products?.map((product: any) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.currentStock} in stock)
                                </SelectItem>
                              ))}
                              {products?.length === 0 && (
                                <div className="p-2 text-sm text-slate-500">No products available.</div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mb-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                            <span>Customer (Optional)</span>
                          </FormLabel>
                          <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger className="h-11 w-full bg-white border-slate-200">
                                <SelectValue placeholder="Select a customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">-- No specific customer --</SelectItem>
                              {customers?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="quantitySold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Quantity Sold
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            className="h-11 bg-white border-slate-200"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalSellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Total Selling Price (₹)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-11 pl-8 bg-white border-slate-200 font-medium"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {unitSellingPrice && (
                  <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Calculated Unit Selling Price:</span>
                    <span className="font-semibold text-emerald-700">
                      ₹{unitSellingPrice} per unit
                    </span>
                  </div>
                )}

                {mutation.isError && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
                    {mutation.error?.message || "Failed to log sales order."}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-6 border-slate-300 hover:bg-slate-100"
                    onClick={() => router.push("/")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                  >
                    {mutation.isPending ? "Logging..." : "Submit Sale"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
