import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        purchases: { take: 1 },
        usedIn: { take: 1 },
      }
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Check referential integrity: prevent deletion if used in purchases or production
    if (material.purchases.length > 0 || material.usedIn.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete material because it has existing purchases or production logs." },
        { status: 400 }
      );
    }

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
