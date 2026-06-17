import { prisma } from "@/lib/prisma";

/// สร้างเลขที่ใบสั่งงาน JOB-YYMM-####
async function nextJobCode(): Promise<string> {
  const now = new Date();
  const prefix = `JOB-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.job.count({ where: { code: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

/// สร้างเลขที่ใบสั่งซื้อ SO-YYMM-####
async function nextSoNumber(): Promise<string> {
  const now = new Date();
  const prefix = `SO-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.quotation.count({ where: { soNumber: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

/// แปลงใบเสนอราคาที่ตกลงแล้ว → ใบสั่งงาน (Job) พร้อมตั้งต้นทุกแผนก
/// chosenQty = ยอดพิมพ์ที่ลูกค้าเลือกตอนรับงาน (ถ้าไม่ระบุใช้ยอดในรายการ)
export async function createJobFromQuotation(quotationId: number, chosenQty?: number) {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });
  if (!q) throw new Error("ไม่พบใบเสนอราคา");

  const existing = await prisma.job.findFirst({ where: { quotationId } });
  if (existing) return existing;

  const quantity = chosenQty && chosenQty > 0 ? chosenQty : q.items.reduce((s, it) => s + it.quantity, 0);
  const plannedSheets = q.items.reduce((s, it) => s + it.sheetsNeeded, 0);
  const title = q.title || q.items[0]?.description || `งานของ ${q.number}`;
  const pressName = q.items.find((it) => it.pressName)?.pressName ?? null;
  const code = await nextJobCode();

  const job = await prisma.job.create({
    data: {
      code,
      quotationId,
      customerId: q.customerId,
      title,
      quantity,
      stage: "prepress",
      status: "open",
      prepress: { create: {} },
      production: { create: { plannedSheets, pressName } },
      postpress: {
        create: {
          processes: JSON.stringify([
            { name: "เคลือบ", done: false },
            { name: "ไดคัท", done: false },
            { name: "ปะกล่อง", done: false },
          ]),
        },
      },
      shipment: { create: {} },
    },
  });

  return job;
}

/// รับงาน: ตั้งสถานะใบเสนอราคาเป็น accepted, ออกเลข SO, แล้วสร้าง Job ตามยอดที่เลือก
export async function acceptQuotation(quotationId: number, chosenQty: number) {
  const q = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!q) throw new Error("ไม่พบใบเสนอราคา");
  if (q.status === "cancelled") throw new Error("งานนี้ถูกยกเลิกแล้ว");

  const soNumber = q.soNumber ?? (await nextSoNumber());
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "accepted", acceptedQty: chosenQty, soNumber, isPattern: false },
  });
  const job = await createJobFromQuotation(quotationId, chosenQty);
  return { job, soNumber };
}

/// ต้นทุนประมาณการของงาน = ผลรวม baseCost ของแต่ละรายการในใบเสนอราคา (จาก meta)
export function estimatedCost(items: { meta: string | null }[]): number {
  let sum = 0;
  for (const it of items) {
    if (!it.meta) continue;
    try {
      const m = JSON.parse(it.meta);
      if (m?.cost?.baseCost) sum += Number(m.cost.baseCost);
    } catch {
      // ข้ามรายการที่ parse ไม่ได้
    }
  }
  return sum;
}

export const STAGE_ORDER = ["prepress", "production", "postpress", "shipping", "done"] as const;

export function nextStage(stage: string): string {
  const i = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return "done";
  return STAGE_ORDER[i + 1];
}
