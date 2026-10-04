"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema } from "@/lib/schema";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Trash2, Plus, ArrowLeft, Box } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

type ProductFormValues = z.infer<typeof ProductSchema>;

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetch("/api/materials");
      return res.json();
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      materials: [{ materialId: "", quantityRequired: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      form.reset({ name: "", materials: [{ materialId: "", quantityRequired: 1 }] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  function onSubmit(values: ProductFormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto p-4 sm:p-8 max-w-6xl flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add Product Form */}
          <div className="lg:col-span-6">
            <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden h-full">
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400" />
              <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-orange-100/80 text-orange-700 border border-orange-200 shadow-xs shrink-0">
                    <Box className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Create Finished Good (BOM)</CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Define a new product and its exact material recipe.
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Premium Office Chair" className="h-11 bg-white border-slate-200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Bill of Materials (Per 1 Unit)</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ materialId: "", quantityRequired: 1 })}>
                          <Plus className="w-4 h-4 mr-2" /> Add Material
                        </Button>
                      </div>
                      
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                          <FormField
                            control={form.control}
                            name={`materials.${index}.materialId`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs font-medium text-slate-700">Raw Material</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="w-full bg-white h-9">
                                      <SelectValue placeholder="Select...">
                                        {materials?.find((m: any) => m.id === field.value)?.name || undefined}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {materials?.map((m: any) => (
                                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`materials.${index}.quantityRequired`}
                            render={({ field }) => (
                              <FormItem className="w-24">
                                <FormLabel className="text-xs font-medium text-slate-700">Qty</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" className="bg-white h-9" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => remove(index)} disabled={fields.length === 1}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {mutation.isError && (
                      <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
                        {mutation.error?.message || "Failed to add product."}
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                      <Button type="submit" disabled={mutation.isPending} className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-all">
                        {mutation.isPending ? "Saving..." : "Save Product Recipe"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Existing Products List */}
          <div className="lg:col-span-6">
            <Card className="shadow-lg border-slate-200/80 bg-white overflow-hidden h-full flex flex-col">
              <div className="h-1.5 w-full bg-slate-200" />
              <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Manage all finished goods and view their material recipes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-6 flex-1 bg-slate-50/30 overflow-y-auto max-h-[600px]">
                {products && products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((p: any) => (
                      <div key={p.id} className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm group relative">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">{p.name}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 transition-all absolute top-2 right-2"
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) deleteMutation.mutate(p.id);
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recipe / BOM</div>
                        <ul className="space-y-1">
                          {p.bom.map((b: any) => (
                            <li key={b.id} className="text-sm text-slate-600 flex justify-between">
                              <span>{b.material.name}</span>
                              <span className="font-medium text-slate-800">{b.quantityRequired} {b.material.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <Box className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No products defined yet.</p>
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
