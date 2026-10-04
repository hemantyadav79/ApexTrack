import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Optional: Prevent deleting if it has sales or production logs, or use cascade.
    // Let's prevent deletion if it's used in production logs.
    const usedInProduction = await prisma.productionLog.findFirst({
      where: { productId: id },
    });

    if (usedInProduction) {
      return NextResponse.json(
        { error: "Cannot delete product because it has associated production logs." },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
