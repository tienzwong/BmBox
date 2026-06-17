import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { thaiDate, num } from "@/lib/format";
import { DESIGN_STATUS, PLATE_STATUS } from "@/lib/labels";
import StatusSelect from "@/components/StatusSelect";

export const dynamic = "force-dynamic";

export default async function PrepressPage() {
  await requireModule("prepress");
  const jobs = await prisma.job.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "asc" },
    include: { customer: true, prepress: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">พรีเพลส — ออกแบบ &amp; ทำเพลท</h1>
        <p className="text-sm text-slate-500">งานที่รอออกแบบและทำแม่พิมพ์ ({jobs.length} งาน)</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ใบสั่งงาน</th>
              <th className="px-5 py-2.5 font-medium">ลูกค้า / งาน</th>
              <th className="px-5 py-2.5 text-center font-medium">จำนวน</th>
              <th className="px-5 py-2.5 font-medium">ออกแบบ</th>
              <th className="px-5 py-2.5 font-medium">ทำเพลท</th>
              <th className="px-5 py-2.5 font-medium">รับเข้า</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">ยังไม่มีงาน</td></tr>
            ) : jobs.map((j) => (
              <tr key={j.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/jobs/${j.id}`} className="font-medium text-brand-700 hover:underline">{j.code}</Link>
                </td>
                <td className="px-5 py-3">
                  <div className="text-slate-700">{j.customer.name}</div>
                  <div className="text-xs text-slate-400">{j.title}</div>
                </td>
                <td className="px-5 py-3 text-center text-slate-600">{num(j.quantity)}</td>
                <td className="px-5 py-3">
                  {j.prepress && (
                    <StatusSelect endpoint="/api/prepress" id={j.prepress.id} field="designStatus" value={j.prepress.designStatus} options={DESIGN_STATUS} />
                  )}
                </td>
                <td className="px-5 py-3">
                  {j.prepress && (
                    <StatusSelect endpoint="/api/prepress" id={j.prepress.id} field="plateStatus" value={j.prepress.plateStatus} options={PLATE_STATUS} />
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">{thaiDate(j.createdAt)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
