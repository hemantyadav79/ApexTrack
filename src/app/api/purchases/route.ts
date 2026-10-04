import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PurchaseSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const purchases = await prisma.purchase.findMany({
      where: { organizationId: session.orgId },
      orderBy: { date: "desc" },
      include: { material: true }
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = PurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { materialId, quantity, totalCost, supplierId } = parsed.data;

    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier || supplier.organizationId !== session.orgId) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }
    }

    // Use a transaction to create the purchase and update the material stock atomically
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: { 
          materialId, 
          quantity, 
          totalCost, 
          supplierId: supplierId || null,
          organizationId: session.orgId 
        },
      });
      await tx.material.update({
        where: { id: materialId },
        data: { currentStock: { increment: quantity } },
      });
      return purchase;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
