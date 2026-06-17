import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "inventory")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();

  if (b.action === "item") {
    if (!b.name) return NextResponse.json({ error: "ต้องระบุชื่อ" }, { status: 400 });
    const item = await prisma.inventoryItem.create({
      data: {
        name: b.name,
        category: b.category || null,
        unit: b.unit || "ชิ้น",
        qtyOnHand: Number(b.qtyOnHand) || 0,
        reorderPoint: Number(b.reorderPoint) || 0,
      },
    });
    return NextResponse.json(item);
  }

  if (b.action === "move") {
    const qty = Number(b.qty);
    if (!b.itemId || !qty) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    const signed = b.type === "out" ? -Math.abs(qty) : Math.abs(qty);
    const [, item] = await prisma.$transaction([
      prisma.stockMove.create({
        data: { itemId: Number(b.itemId), qty: signed, type: b.type || "in", note: b.note || null },
      }),
      prisma.inventoryItem.update({
        where: { id: Number(b.itemId) },
        data: { qtyOnHand: { increment: signed } },
      }),
    ]);
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
}
