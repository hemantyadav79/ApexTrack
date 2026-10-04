import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductionSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const productionLogs = await prisma.productionLog.findMany({
      where: { organizationId: session.orgId },
      orderBy: { date: "desc" },
      include: {
        product: true,
        materialsUsed: {
          include: { material: true }
        }
      }
    });
    return NextResponse.json(productionLogs);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = ProductionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    
    const { productId, quantityProduced } = parsed.data;

    // Fetch the product and its BOM
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { bom: true }
    });

    if (!product || product.organizationId !== session.orgId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.bom.length === 0) {
      return NextResponse.json({ error: "Product has no Bill of Materials (BOM) configured." }, { status: 400 });
    }

    // Use a transaction to create the production log, link materials, and decrement stock
    const result = await prisma.$transaction(async (tx) => {
      // First, check if we have enough stock for all required materials
      for (const bomItem of product.bom) {
        const totalRequired = bomItem.quantityRequired * quantityProduced;
        const material = await tx.material.findUnique({ where: { id: bomItem.materialId } });
        
        if (!material || material.organizationId !== session.orgId) {
          throw new Error(`Material not found (ID: ${bomItem.materialId})`);
        }
        
        if (material.currentStock < totalRequired) {
          throw new Error(`Insufficient stock for ${material.name}. Required: ${totalRequired}, Available: ${material.currentStock}`);
        }
      }

      // Create log
      const prodLog = await tx.productionLog.create({
        data: {
          productName: product.name, // Keep for historical record
          productId: product.id,
          quantityProduced,
          organizationId: session.orgId,
          materialsUsed: {
            create: product.bom.map(bomItem => ({
              materialId: bomItem.materialId,
              quantityUsed: bomItem.quantityRequired * quantityProduced,
            }))
          }
        },
        include: { materialsUsed: true }
      });

      // Deduct stock
      for (const bomItem of product.bom) {
        const totalRequired = bomItem.quantityRequired * quantityProduced;
        await tx.material.update({
          where: { id: bomItem.materialId },
          data: { currentStock: { decrement: totalRequired } },
        });
      }

      // Add to product finished goods stock
      await tx.product.update({
        where: { id: product.id },
        data: { currentStock: { increment: quantityProduced } }
      });

      return prodLog;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    // Return specific error message if thrown from transaction
    if (error.message.includes("Insufficient stock") || error.message.includes("Material not found")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
