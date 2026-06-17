import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "purchasing")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "ต้องระบุชื่อ" }, { status: 400 });
  const s = await prisma.supplier.create({
    data: { name: b.name, taxId: b.taxId || null, phone: b.phone || null, contact: b.contact || null },
  });
  return NextResponse.json(s);
}
