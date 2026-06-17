import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

/// คัดลอกใบประเมิน/แม่แบบ → ใบประเมินใหม่ (status=estimating, isPattern=false)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "createQuotation")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const { id } = await params;
    const src = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { items: true, quantities: true },
    });
    if (!src) return NextResponse.json({ error: "ไม่พบใบประเมิน" }, { status: 404 });

    const now = new Date();
    const prefix = `QT-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await prisma.quotation.count({ where: { number: { startsWith: prefix } } });
    const number = `${prefix}-${String(count + 1).padStart(4, "0")}`;

    const copy = await prisma.quotation.create({
      data: {
        number,
        customerId: src.customerId,
        validDays: src.validDays,
        vatPercent: src.vatPercent,
        discount: src.discount,
        note: src.note,
        title: src.title,
        jobType: src.jobType,
        specDetail: src.specDetail,
        salesperson: src.salesperson,
        isPattern: false,
        status: "estimating",
        subtotal: src.subtotal,
        vatAmount: src.vatAmount,
        total: src.total,
        quantities: {
          create: src.quantities.map((qq) => ({ qty: qq.qty, label: qq.label, sortOrder: qq.sortOrder })),
        },
        items: {
          create: src.items.map((it) => ({
            description: it.description,
            pieceW: it.pieceW,
            pieceH: it.pieceH,
            bleed: it.bleed,
            quantity: it.quantity,
            layoutCategory: it.layoutCategory,
            pageCount: it.pageCount,
            setsPerBook: it.setsPerBook,
            priceMode: it.priceMode,
            paperId: it.paperId,
            colorsFront: it.colorsFront,
            colorsBack: it.colorsBack,
            pressId: it.pressId,
            pressName: it.pressName,
            cutsPerParent: it.cutsPerParent,
            pressSheets: it.pressSheets,
            upsPerSheet: it.upsPerSheet,
            sheetsNeeded: it.sheetsNeeded,
            efficiency: it.efficiency,
            unitPrice: it.unitPrice,
            amount: it.amount,
            meta: it.meta,
          })),
        },
      },
    });
    return NextResponse.json({ id: copy.id, number: copy.number });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ผิดพลาด" }, { status: 500 });
  }
}
