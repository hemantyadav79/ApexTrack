import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { MaterialSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const materials = await prisma.material.findMany({
      where: { organizationId: session.orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = MaterialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    
    const { initialQuantity, initialTotalCost, ...materialData } = parsed.data;

    const existing = await prisma.material.findFirst({
      where: {
        organizationId: session.orgId,
        name: materialData.name,
      }
    });
    if (existing) {
      return NextResponse.json({ error: "A material with this name already exists." }, { status: 400 });
    }
    
    if (initialQuantity && initialQuantity > 0) {
      const material = await prisma.$transaction(async (tx) => {
        const mat = await tx.material.create({
          data: {
            ...materialData,
            currentStock: initialQuantity,
            organizationId: session.orgId,
          },
        });
        
        await tx.purchase.create({
          data: {
            materialId: mat.id,
            quantity: initialQuantity,
            totalCost: initialTotalCost || 0,
            organizationId: session.orgId,
          }
        });
        
        return mat;
      });
      return NextResponse.json(material);
    } else {
      const material = await prisma.material.create({
        data: {
          ...materialData,
          organizationId: session.orgId,
        },
      });
      return NextResponse.json(material);
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, unit, minStockThreshold } = body;
    
    if (!id || !name || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== session.orgId) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Check name conflict
    const nameConflict = await prisma.material.findFirst({
      where: {
        organizationId: session.orgId,
        name,
        id: { not: id }
      }
    });
    if (nameConflict) {
      return NextResponse.json({ error: "Another material with this name already exists." }, { status: 400 });
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { name, unit, minStockThreshold: Number(minStockThreshold) || 0 }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
