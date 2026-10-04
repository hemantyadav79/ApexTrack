"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductionSchema } from "@/lib/schema";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Factory, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

type ProductionFormValues = z.infer<typeof ProductionSchema>;

export default function ProductionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(ProductionSchema),
    defaultValues: {
      productId: "",
      quantityProduced: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductionFormValues) => {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log production");
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

  function onSubmit(values: ProductionFormValues) {
    mutation.mutate(values);
  }

  const selectedProductId = form.watch("productId");
  const quantityProduced = form.watch("quantityProduced") || 0;
  
  const selectedProduct = products?.find((p: any) => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 sm:p-8 max-w-4xl flex-1 flex flex-col justify-center">
        <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-400" />
          <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-violet-100/80 text-violet-700 border border-violet-200 shadow-xs shrink-0">
                <Factory className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Log Production Batch
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Select a finished product to manufacture. We will automatically deduct the required raw materials based on the Bill of Materials (BOM).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-6">
            
            {products?.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-600 mb-4">You have not defined any Products (BOM) yet.</p>
                <Link href="/products">
                  <Button className="bg-orange-600 hover:bg-orange-700">Create a Product Recipe First</Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">Select Product to Manufacture</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full h-11 bg-white border-slate-200">
                                <SelectValue placeholder="Choose a product...">
                                  {selectedProduct ? selectedProduct.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products?.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantityProduced"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">Quantity Produced (Units)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" className="h-11 bg-white border-slate-200" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* BOM Preview / Material Deduction Summary */}
                  {selectedProduct && quantityProduced > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                        Estimated Material Deductions
                        <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                      </h3>
                      <ul className="space-y-2">
                        {selectedProduct.bom.map((b: any) => (
                          <li key={b.id} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">{b.material.name}</span>
                            <span className="font-semibold text-rose-600 tabular-nums">
                              - {(b.quantityRequired * quantityProduced).toFixed(2)} {b.material.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {mutation.isError && (
                    <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200 font-medium">
                      {mutation.error?.message || "Failed to log production batch."}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
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
                      disabled={mutation.isPending || !selectedProduct}
                      className="h-11 px-8 bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-sm transition-all"
                    >
                      {mutation.isPending ? "Logging..." : "Confirm Production Log"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
