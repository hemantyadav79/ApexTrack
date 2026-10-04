import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductSchema } from "@/lib/schema";
import { z } from "zod";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      where: { organizationId: session.orgId },
      include: {
        bom: {
          include: {
            material: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = ProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, materials } = parsed.data;

    // Check if product with name already exists
    const existing = await prisma.product.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this name already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        organizationId: session.orgId,
        bom: {
          create: materials.map(m => ({
            materialId: m.materialId,
            quantityRequired: m.quantityRequired,
          }))
        }
      },
      include: {
        bom: true,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
