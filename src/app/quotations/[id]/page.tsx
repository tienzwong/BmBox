import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { baht, num, thaiDate } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import QuotationActions from "@/components/QuotationActions";
import CopyButton from "@/components/CopyButton";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  estimating: { label: "อยู่ระหว่างเสนอราคา", cls: "bg-amber-50 text-amber-700" },
  accepted: { label: "ตกลงรับงานแล้ว", cls: "bg-green-50 text-green-700" },
  cancelled: { label: "ยกเลิกงาน", cls: "bg-red-50 text-red-600" },
};

interface QtyMeta {
  qty: number;
  total: number | null;
}

export default async function QuotationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const showPrice = can(user.role, "viewPrice");
  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      items: { include: { paper: true } },
      quantities: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!q) notFound();
  const job = await prisma.job.findFirst({
    where: { quotationId: q.id },
    select: { id: true, code: true },
  });
  const canCreateJob = can(user.role, "createQuotation");
  const status = STATUS_LABEL[q.status] ?? STATUS_LABEL.estimating;

  // รวมต้นทุนรายยอดพิมพ์จาก meta ของแต่ละรายการ
  const qtyTotals: QtyMeta[] = q.quantities.map((qq) => {
    let total = 0;
    let hasAny = false;
    for (const it of q.items) {
      if (!it.meta) continue;
      try {
        const m = JSON.parse(it.meta);
        const row = (m.perQty as { qty: number; total: number | null }[] | undefined)?.find(
          (p) => p.qty === qq.qty
        );
        if (row?.total != null) {
          total += row.total;
          hasAny = true;
        }
      } catch {
        // ข้าม
      }
    }
    return { qty: qq.qty, total: hasAny ? total : null };
  });
  const fallbackQty: QtyMeta[] =
    qtyTotals.length > 0 ? qtyTotals : [{ qty: q.acceptedQty ?? q.items[0]?.quantity ?? 0, total: q.subtotal }];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link href="/quotations" className="text-sm text-brand-600 hover:underline">
          ← กลับ
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <QuotationActions
            quotationId={q.id}
            status={q.status}
            quantities={fallbackQty}
            existingJob={job}
            canManage={canCreateJob}
          />
          {canCreateJob && <CopyButton quotationId={q.id} isPattern={q.isPattern} />}
          <PrintButton />
        </div>
      </div>

      <div className="card p-8 print:border-0 print:shadow-none">
        {/* หัวกระดาษ */}
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
              Bm
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">บริษัท เบลสโมทีฟ จำกัด</div>
              <div className="text-xs text-slate-500">BmBox · โรงพิมพ์แพคเกจจิ้งกระดาษ</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-brand-700">
              {q.isPattern ? "แม่แบบงานพิมพ์" : showPrice ? "ใบเสนอราคา" : "ใบสั่งงานผลิต"}
            </div>
            <div className="text-sm text-slate-500">{q.number}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              {q.isPattern && <span className="badge bg-violet-50 text-violet-700 print:hidden">Pattern</span>}
              <span className={`badge print:hidden ${status.cls}`}>{status.label}</span>
            </div>
            {q.soNumber && <div className="mt-1 text-xs text-slate-500">SO: {q.soNumber}</div>}
          </div>
        </div>

        {/* ข้อมูลลูกค้า + งาน */}
        <div className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">เสนอแก่</div>
            <div className="font-semibold text-slate-800">{q.customer.name}</div>
            {q.customer.address && <div className="text-slate-500">{q.customer.address}</div>}
            {q.customer.taxId && <div className="text-slate-500">เลขผู้เสียภาษี: {q.customer.taxId}</div>}
            {q.customer.phone && <div className="text-slate-500">โทร: {q.customer.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-slate-500">วันที่: {thaiDate(q.issueDate)}</div>
            <div className="text-slate-500">ยืนราคา: {q.validDays} วัน</div>
            {q.salesperson && <div className="text-slate-500">พนักงานขาย: {q.salesperson}</div>}
          </div>
        </div>

        {(q.title || q.jobType || q.specDetail) && (
          <div className="mb-2 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            {q.title && <div className="font-medium text-slate-700">{q.title}</div>}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
              {q.jobType && <span>ลักษณะงาน: {q.jobType}</span>}
              {q.specDetail && <span>Spec: {q.specDetail}</span>}
              {q.acceptedQty && <span>ยอดที่รับงาน: {num(q.acceptedQty)}</span>}
            </div>
          </div>
        )}

        {/* เปรียบเทียบยอดพิมพ์ */}
        {showPrice && qtyTotals.length > 1 && (
          <div className="mb-4 table-scroll rounded-lg border border-line print:hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-400">
                <tr>
                  <th className="px-3 py-2">ยอดพิมพ์</th>
                  <th className="px-3 py-2 text-right">ต้นทุน/ราคารวม</th>
                  <th className="px-3 py-2 text-right">/หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {qtyTotals.map((o) => (
                  <tr key={o.qty} className={`border-t border-line ${o.qty === q.acceptedQty ? "bg-brand-50/40" : ""}`}>
                    <td className="px-3 py-2">{num(o.qty)}</td>
                    <td className="px-3 py-2 text-right">{o.total != null ? baht(o.total) : "-"}</td>
                    <td className="px-3 py-2 text-right">{o.total != null && o.qty > 0 ? baht(o.total / o.qty) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ตารางรายการ */}
        <div className="table-scroll">
          <table>
          <thead className="border-y border-line bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">รายการ</th>
              <th className="px-3 py-2 text-center font-medium">ขนาด (ซม.)</th>
              <th className="px-3 py-2 text-center font-medium">จำนวน</th>
              {showPrice && <th className="px-3 py-2 text-right font-medium">ราคา/ชิ้น</th>}
              {showPrice && <th className="px-3 py-2 text-right font-medium">รวม</th>}
            </tr>
          </thead>
          <tbody>
            {q.items.map((it) => (
              <tr key={it.id} className="border-b border-line align-top">
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-800">{it.description}</div>
                  <div className="text-xs text-slate-400">
                    {it.paper?.name ?? "-"} · พิมพ์ {it.colorsFront}
                    {it.colorsBack > 0 ? `+${it.colorsBack}` : ""} สี
                    {it.pressName ? ` · ${it.pressName}` : ""} · {num(it.cutsPerParent)} ตัด/แผ่นใหญ่ ·
                    วางได้ {num(it.upsPerSheet)} ชิ้น/แผ่นพิมพ์ · ใช้แผ่นใหญ่ {num(it.sheetsNeeded)} แผ่น
                    (คุ้ม {num(it.efficiency * 100, 1)}%)
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-slate-600">
                  {num(it.pieceW, 1)}×{num(it.pieceH, 1)}
                </td>
                <td className="px-3 py-3 text-center text-slate-600">{num(it.quantity)}</td>
                {showPrice && <td className="px-3 py-3 text-right text-slate-600">{baht(it.unitPrice)}</td>}
                {showPrice && <td className="px-3 py-3 text-right font-medium text-slate-800">{baht(it.amount)}</td>}
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {/* สรุป */}
        {showPrice && (
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">ยอดรวม</span>
              <span className="text-slate-700">{baht(q.subtotal)}</span>
            </div>
            {q.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">ส่วนลด</span>
                <span className="text-slate-700">-{baht(q.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">VAT {num(q.vatPercent)}%</span>
              <span className="text-slate-700">{baht(q.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <span className="text-slate-800">ยอดสุทธิ</span>
              <span className="text-brand-700">{baht(q.total)}</span>
            </div>
          </div>
        </div>
        )}

        {q.note && (
          <div className="mt-6 border-t border-line pt-4 text-xs text-slate-500">
            <span className="font-medium">หมายเหตุ:</span> {q.note}
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
          <div>
            <div className="mb-10">ผู้เสนอราคา</div>
            <div className="border-t border-line pt-1">บริษัท เบลสโมทีฟ จำกัด</div>
          </div>
          <div>
            <div className="mb-10">ผู้อนุมัติ</div>
            <div className="border-t border-line pt-1">{q.customer.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
