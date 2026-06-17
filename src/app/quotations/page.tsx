import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { baht, thaiDate } from "@/lib/format";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  estimating: { label: "อยู่ระหว่างเสนอราคา", cls: "bg-amber-50 text-amber-700" },
  accepted: { label: "ตกลงรับงาน", cls: "bg-green-50 text-green-700" },
  cancelled: { label: "ยกเลิก", cls: "bg-red-50 text-red-600" },
  // ค่าเดิม (เผื่อข้อมูลเก่า)
  draft: { label: "ร่าง", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "ส่งแล้ว", cls: "bg-brand-50 text-brand-700" },
  rejected: { label: "ปฏิเสธ", cls: "bg-red-50 text-red-600" },
};

export default async function QuotationsPage() {
  const user = await requireUser();
  const showPrice = can(user.role, "viewPrice");
  const quotations = await prisma.quotation.findMany({
    where: { isPattern: false },
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });
  const patternCount = await prisma.quotation.count({ where: { isPattern: true } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ใบเสนอราคา</h1>
          <p className="text-sm text-slate-500">รายการทั้งหมด {quotations.length} ใบ</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quotations/patterns" className="btn-outline">
            แม่แบบ ({patternCount})
          </Link>
          <Link href="/quotations/new" className="btn-primary">
            ＋ สร้างใหม่
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {quotations.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="table-scroll">
            <table>
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">เลขที่</th>
                <th className="px-5 py-2.5 font-medium">ลูกค้า</th>
                <th className="px-5 py-2.5 font-medium">วันที่</th>
                <th className="px-5 py-2.5 text-center font-medium">รายการ</th>
                <th className="px-5 py-2.5 font-medium">สถานะ</th>
                {showPrice && <th className="px-5 py-2.5 text-right font-medium">ยอดสุทธิ</th>}
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const st = STATUS[q.status] ?? STATUS.draft;
                return (
                  <tr key={q.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/quotations/${q.id}`} className="font-medium text-brand-700 hover:underline">
                        {q.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{q.customer.name}</td>
                    <td className="px-5 py-3 text-slate-500">{thaiDate(q.issueDate)}</td>
                    <td className="px-5 py-3 text-center text-slate-500">{q.items.length}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                    </td>
                    {showPrice && (
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">{baht(q.total)}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
