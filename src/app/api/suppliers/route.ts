import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SupplierSchema } from "@/lib/schema";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: session.orgId },
      include: {
        _count: { select: { purchases: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = SupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const existing = await prisma.supplier.findFirst({
      where: { organizationId: session.orgId, name: parsed.data.name }
    });
    if (existing) {
      return NextResponse.json({ error: "Supplier with this name already exists" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...parsed.data,
        organizationId: session.orgId,
      }
    });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
