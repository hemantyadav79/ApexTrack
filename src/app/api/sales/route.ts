import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { SaleSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sales = await prisma.sale.findMany({
      where: { organizationId: session.orgId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = SaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    
    const { productId, quantitySold, totalSellingPrice, customerId } = parsed.data;

    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer || customer.organizationId !== session.orgId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
    }
    
    // Check stock
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.organizationId !== session.orgId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.currentStock < quantitySold) {
      return NextResponse.json({ 
        error: `Insufficient stock! You only have ${product.currentStock} ${product.name}(s) available. Please run a production batch or manually adjust inventory.` 
      }, { status: 400 });
    }

    // Transaction to log sale and decrement stock
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          productId,
          productName: product.name, // keep for historical record
          quantitySold,
          totalSellingPrice,
          customerId: customerId || null,
          organizationId: session.orgId
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: quantitySold } }
      });

      return sale;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
