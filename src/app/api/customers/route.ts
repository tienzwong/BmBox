import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "manageMasterData")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "ต้องระบุชื่อ" }, { status: 400 });
    const customer = await prisma.customer.create({
      data: {
        name: b.name,
        taxId: b.taxId || null,
        address: b.address || null,
        phone: b.phone || null,
        email: b.email || null,
        contact: b.contact || null,
      },
    });
    return NextResponse.json(customer);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
