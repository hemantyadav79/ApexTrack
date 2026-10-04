"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialSchema } from "@/lib/schema";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { Trash2, PackagePlus, ArrowLeft, Layers, Edit2, X } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

type MaterialFormValues = z.infer<typeof MaterialSchema>;

export default function MaterialsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetch("/api/materials");
      return res.json();
    },
  });

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(MaterialSchema),
    defaultValues: {
      name: "",
      unit: "",
      minStockThreshold: 0,
      initialQuantity: 0,
      initialTotalCost: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: MaterialFormValues) => {
      const isEdit = !!editingId;
      const res = await fetch("/api/materials", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...values } : values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEdit ? "update" : "add"} material`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      form.reset({
        name: "",
        unit: "",
        minStockThreshold: 0,
        initialQuantity: 0,
        initialTotalCost: 0,
      });
      setEditingId(null);
    },
  });

  function onSubmit(values: MaterialFormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 sm:p-8 max-w-6xl flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add Material Form (Left Column) */}
          <div className="lg:col-span-5">
            <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden h-full">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
              <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-100/80 text-blue-700 border border-blue-200 shadow-xs shrink-0">
                    {editingId ? <Edit2 className="w-6 h-6" /> : <PackagePlus className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">
                      {editingId ? "Edit Material" : "Add Master Material"}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      {editingId ? "Update material details below." : "Register a new raw material to start tracking its inventory."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">Material Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Aluminum Ingot" className="h-11 bg-white border-slate-200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">Unit of Measurement</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. kg, lbs, pieces" className="h-11 bg-white border-slate-200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="minStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">Minimum Stock Alert Threshold</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" className="h-11 bg-white border-slate-200" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!editingId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="initialQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700">Initial Stock (Optional)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="0" className="h-11 bg-white border-slate-200" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="initialTotalCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700">Total Cost (₹)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
                                  <Input type="number" min="0" placeholder="0" className="h-11 pl-8 bg-white border-slate-200" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {mutation.isError && (
                      <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
                        {mutation.error?.message || `Failed to ${editingId ? "update" : "add"} material.`}
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                      {editingId && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="h-11 px-6"
                          onClick={() => {
                            setEditingId(null);
                            form.reset({ name: "", unit: "", minStockThreshold: 0, initialQuantity: 0, initialTotalCost: 0 });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" disabled={mutation.isPending} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all">
                        {mutation.isPending ? "Saving..." : (editingId ? "Update Material" : "Add Material")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Existing Materials List (Right Column) */}
          <div className="lg:col-span-7">
            <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden h-full flex flex-col">
              <div className="h-1.5 w-full bg-slate-200" />
              <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shadow-xs shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Registered Materials</CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Manage all raw materials currently tracked in inventory.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-6 flex-1 bg-slate-50/30">
                {materials && materials.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {materials.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-4 border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
                        <div className="truncate pr-4">
                          <p className="font-semibold text-sm text-slate-900 truncate" title={m.name}>{m.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-md text-slate-600">
                              Stock: {m.currentStock} {m.unit}
                            </p>
                            {m.currentStock <= m.minStockThreshold && m.minStockThreshold > 0 && (
                              <p className="text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md animate-pulse">
                                Low Stock
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 transition-all focus:opacity-100"
                            onClick={() => {
                              setEditingId(m.id);
                              form.reset({
                                name: m.name,
                                unit: m.unit,
                                minStockThreshold: m.minStockThreshold,
                                initialQuantity: 0,
                                initialTotalCost: 0
                              });
                            }}
                            title="Edit material"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Layers className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No materials registered yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Add your first material using the form.</p>
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
