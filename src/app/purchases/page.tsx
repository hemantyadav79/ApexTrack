"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PurchaseSchema } from "@/lib/schema";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Navbar } from "@/components/Navbar";

type PurchaseFormValues = z.infer<typeof PurchaseSchema>;

export default function PurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetch("/api/materials");
      return res.json();
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      return res.json();
    },
  });

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(PurchaseSchema),
    defaultValues: {
      materialId: "",
      quantity: 0,
      totalCost: 0,
      supplierId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: PurchaseFormValues) => {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log purchase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      form.reset();
      router.push("/");
    },
  });

  function onSubmit(values: PurchaseFormValues) {
    mutation.mutate(values);
  }

  const selectedMaterialId = form.watch("materialId");
  const quantityValue = form.watch("quantity");
  const totalCostValue = form.watch("totalCost");
  const selectedMaterial = materials?.find((m: any) => m.id === selectedMaterialId);
  const unitPrice =
    quantityValue > 0 && totalCostValue > 0
      ? (totalCostValue / quantityValue).toFixed(2)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 sm:p-8 max-w-4xl flex-1 flex flex-col justify-center">
        <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
          <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-100/80 text-blue-700 border border-blue-200 shadow-xs shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Log Purchase Order
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Record incoming raw materials, update inventory stock, and track procurement expenses in INR (₹).
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
                      name="materialId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Select Raw Material
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 w-full bg-white border-slate-200">
                                <SelectValue placeholder="Choose a raw material...">
                                  {selectedMaterial ? selectedMaterial.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {materials?.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name} ({m.currentStock} {m.unit} in stock)
                                </SelectItem>
                              ))}
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
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                            <span>Supplier (Optional)</span>
                          </FormLabel>
                          <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger className="h-11 w-full bg-white border-slate-200">
                                <SelectValue placeholder="Select a supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">-- No specific supplier --</SelectItem>
                              {suppliers?.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Quantity Bought {selectedMaterial ? `(${selectedMaterial.unit})` : ""}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-11 bg-white border-slate-200"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Total Cost (₹)
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

                {unitPrice && (
                  <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Calculated Unit Cost:</span>
                    <span className="font-semibold text-blue-700">
                      ₹{unitPrice} per {selectedMaterial?.unit || "unit"}
                    </span>
                  </div>
                )}

                {mutation.isError && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
                    {mutation.error?.message || "Failed to log purchase order."}
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
                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                  >
                    {mutation.isPending ? "Logging..." : "Submit Purchase"}
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
