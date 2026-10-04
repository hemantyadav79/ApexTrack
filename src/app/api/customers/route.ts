import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CustomerSchema } from "@/lib/schema";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await prisma.customer.findMany({
      where: { organizationId: session.orgId },
      include: {
        _count: { select: { sales: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const existing = await prisma.customer.findFirst({
      where: { organizationId: session.orgId, name: parsed.data.name }
    });
    if (existing) {
      return NextResponse.json({ error: "Customer with this name already exists" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        ...parsed.data,
        organizationId: session.orgId,
      }
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
