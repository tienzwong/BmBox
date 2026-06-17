import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { PRODUCTION_STATUS } from "@/lib/labels";
import StatusSelect from "@/components/StatusSelect";
import NumberInline from "@/components/NumberInline";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  await requireModule("production");
  const jobs = await prisma.job.findMany({
    where: { status: "open", stage: { in: ["production", "postpress", "shipping", "done"] } },
    orderBy: { createdAt: "asc" },
    include: { customer: true, production: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">ฝ่ายผลิต — เครื่องพิมพ์</h1>
        <p className="text-sm text-slate-500">งานที่พร้อมพิมพ์/กำลังพิมพ์ ({jobs.length} งาน)</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ใบสั่งงาน</th>
              <th className="px-5 py-2.5 font-medium">ลูกค้า / งาน</th>
              <th className="px-5 py-2.5 font-medium">เครื่อง</th>
              <th className="px-5 py-2.5 text-right font-medium">แผนพิมพ์ (แผ่น)</th>
              <th className="px-5 py-2.5 font-medium">พิมพ์จริง</th>
              <th className="px-5 py-2.5 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">ยังไม่มีงานเข้าผลิต</td></tr>
            ) : jobs.map((j) => (
              <tr key={j.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/jobs/${j.id}`} className="font-medium text-brand-700 hover:underline">{j.code}</Link>
                </td>
                <td className="px-5 py-3">
                  <div className="text-slate-700">{j.customer.name}</div>
                  <div className="text-xs text-slate-400">{j.title}</div>
                </td>
                <td className="px-5 py-3 text-slate-600">{j.production?.pressName ?? "-"}</td>
                <td className="px-5 py-3 text-right text-slate-600">{num(j.production?.plannedSheets ?? 0)}</td>
                <td className="px-5 py-3">
                  {j.production && (
                    <NumberInline endpoint="/api/production" id={j.production.id} field="printedSheets" value={j.production.printedSheets} suffix="แผ่น" />
                  )}
                </td>
                <td className="px-5 py-3">
                  {j.production && (
                    <StatusSelect endpoint="/api/production" id={j.production.id} field="status" value={j.production.status} options={PRODUCTION_STATUS} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
