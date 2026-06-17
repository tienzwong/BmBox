import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export async function GET() {
  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });
  return NextResponse.json(quotations);
}

interface ItemPayload {
  description: string;
  pieceW: number;
  pieceH: number;
  bleed: number;
  quantity: number;
  layoutCategory: string;
  pageCount: number | null;
  setsPerBook: number | null;
  priceMode: string;
  paperId: number | null;
  colorsFront: number;
  colorsBack: number;
  pressId: number | null;
  pressName: string | null;
  cutsPerParent: number;
  pressSheets: number;
  upsPerSheet: number;
  sheetsNeeded: number;
  efficiency: number;
  unitPrice: number;
  amount: number;
  meta: string;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (!can(user.role, "createQuotation")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์สร้างใบเสนอราคา" }, { status: 403 });
    }
    const body = await req.json();
    const {
      customerId,
      newCustomerName,
      validDays = 30,
      vatPercent = 7,
      discount = 0,
      note = "",
      title = null,
      jobType = null,
      specDetail = null,
      salesperson = null,
      isPattern = false,
      quantities = [],
      items,
    }: {
      customerId: number | null;
      newCustomerName: string | null;
      validDays: number;
      vatPercent: number;
      discount: number;
      note: string;
      title: string | null;
      jobType: string | null;
      specDetail: string | null;
      salesperson: string | null;
      isPattern: boolean;
      quantities: number[];
      items: ItemPayload[];
    } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "ต้องมีอย่างน้อย 1 รายการ" }, { status: 400 });
    }

    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      if (!newCustomerName) {
        return NextResponse.json({ error: "ต้องระบุลูกค้า" }, { status: 400 });
      }
      const c = await prisma.customer.create({ data: { name: newCustomerName } });
      finalCustomerId = c.id;
    }

    const subtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const vatAmount = afterDiscount * (vatPercent / 100);
    const total = afterDiscount + vatAmount;

    // เลขที่เอกสาร QT-YYMM-####
    const now = new Date();
    const prefix = `QT-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await prisma.quotation.count({ where: { number: { startsWith: prefix } } });
    const number = `${prefix}-${String(count + 1).padStart(4, "0")}`;

    const validQty = (quantities ?? []).filter((q) => q > 0).slice(0, 4);

    const quotation = await prisma.quotation.create({
      data: {
        number,
        customerId: finalCustomerId,
        validDays,
        vatPercent,
        discount,
        note,
        title,
        jobType,
        specDetail,
        salesperson,
        isPattern,
        status: isPattern ? "estimating" : "estimating",
        subtotal,
        vatAmount,
        total,
        quantities: {
          create: validQty.map((q, i) => ({ qty: q, sortOrder: i })),
        },
        items: {
          create: items.map((it) => ({
            description: it.description,
            pieceW: it.pieceW,
            pieceH: it.pieceH,
            bleed: it.bleed,
            quantity: it.quantity,
            layoutCategory: it.layoutCategory ?? "twoSide",
            pageCount: it.pageCount,
            setsPerBook: it.setsPerBook,
            priceMode: it.priceMode ?? "margin",
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

    return NextResponse.json({ id: quotation.id, number: quotation.number });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
