import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { thaiDate } from "@/lib/format";
import { requireUser } from "@/lib/auth/session";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function PatternsPage() {
  await requireUser();
  const patterns = await prisma.quotation.findMany({
    where: { isPattern: true },
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">แม่แบบงานพิมพ์ (Pattern)</h1>
          <p className="text-sm text-slate-500">งานที่สั่งบ่อย — สร้างใบประเมินใหม่จากแม่แบบได้ทันที</p>
        </div>
        <Link href="/quotations" className="btn-outline">← ใบเสนอราคา</Link>
      </div>

      <div className="card overflow-hidden">
        {patterns.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            ยังไม่มีแม่แบบ · สร้างได้จากปุ่ม &quot;บันทึกเป็นแม่แบบ&quot; ตอนสร้างใบเสนอราคา
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead className="bg-slate-50 text-left text-xs text-slate-400">
                <tr>
                  <th className="px-5 py-2.5 font-medium">เลขที่</th>
                  <th className="px-5 py-2.5 font-medium">ชื่องาน</th>
                  <th className="px-5 py-2.5 font-medium">ลักษณะงาน</th>
                  <th className="px-5 py-2.5 text-center font-medium">รายการ</th>
                  <th className="px-5 py-2.5 font-medium">วันที่</th>
                  <th className="px-5 py-2.5 text-right font-medium">สร้างงาน</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((p) => (
                  <tr key={p.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/quotations/${p.id}`} className="font-medium text-brand-700 hover:underline">
                        {p.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{p.title ?? p.items[0]?.description ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-500">{p.jobType ?? "-"}</td>
                    <td className="px-5 py-3 text-center text-slate-500">{p.items.length}</td>
                    <td className="px-5 py-3 text-slate-500">{thaiDate(p.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <CopyButton quotationId={p.id} isPattern />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
