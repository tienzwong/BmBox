import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

/** สร้างรายชื่อที่เป็นทั้งลูกค้าและผู้จำหน่าย พร้อมเชื่อมความสัมพันธ์ */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "manageMasterData")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "ต้องระบุชื่อ" }, { status: 400 });

    const data = {
      name: b.name,
      taxId: b.taxId || null,
      address: b.address || null,
      phone: b.phone || null,
      email: b.email || null,
      contact: b.contact || null,
    };

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({ data });
      const supplier = await tx.supplier.create({
        data: { ...data, customerId: customer.id },
      });
      return { customer, supplier };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
