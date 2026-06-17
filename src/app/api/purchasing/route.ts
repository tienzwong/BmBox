import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

async function nextPoNumber(): Promise<string> {
  const now = new Date();
  const prefix = `PO-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.purchaseOrder.count({ where: { number: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

interface POItem {
  description: string;
  qty: number;
  unit?: string;
  unitPrice: number;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "purchasing")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const items: POItem[] = (b.items || []).filter((it: POItem) => it.description);
  if (!b.supplierId || items.length === 0) {
    return NextResponse.json({ error: "เลือกผู้ขายและเพิ่มรายการ" }, { status: 400 });
  }
  const total = items.reduce((s, it) => s + Number(it.qty) * Number(it.unitPrice), 0);
  const number = await nextPoNumber();
  const po = await prisma.purchaseOrder.create({
    data: {
      number,
      supplierId: Number(b.supplierId),
      note: b.note || null,
      total,
      items: {
        create: items.map((it) => ({
          description: it.description,
          qty: Number(it.qty),
          unit: it.unit || null,
          unitPrice: Number(it.unitPrice),
          amount: Number(it.qty) * Number(it.unitPrice),
        })),
      },
    },
  });
  return NextResponse.json({ id: po.id, number: po.number });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "purchasing")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  if (typeof b.status !== "string") return NextResponse.json({ error: "ไม่มีสถานะ" }, { status: 400 });
  await prisma.purchaseOrder.update({ where: { id: Number(b.id) }, data: { status: b.status } });
  return NextResponse.json({ ok: true });
}
