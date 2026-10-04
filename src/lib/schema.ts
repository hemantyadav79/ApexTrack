import { z } from "zod";

export const AuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const MaterialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  unit: z.string().min(1, "Unit is required (e.g., kg, L)"),
  minStockThreshold: z.number().min(0, "Threshold cannot be negative"),
  initialQuantity: z.number().min(0).optional(),
  initialTotalCost: z.number().min(0).optional(),
});

export const PurchaseSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  quantity: z.number().positive("Quantity must be positive"),
  totalCost: z.number().min(0, "Total cost cannot be negative"),
});

export const SaleSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantitySold: z.number().int().positive("Quantity must be a positive integer"),
  totalSellingPrice: z.number().min(0, "Selling price cannot be negative"),
});

export const ProductBOMSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  quantityRequired: z.number().positive("Quantity required must be positive"),
});

export const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  materials: z.array(ProductBOMSchema).min(1, "At least one material must be added to the recipe"),
});

export const ProductionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantityProduced: z.number().int().positive("Quantity produced must be positive"),
});
