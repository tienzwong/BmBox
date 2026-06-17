import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { POSTPRESS_STATUS } from "@/lib/labels";
import StatusSelect from "@/components/StatusSelect";
import ProcessChecklist from "@/components/ProcessChecklist";

export const dynamic = "force-dynamic";

export default async function PostpressPage() {
  await requireModule("postpress");
  const jobs = await prisma.job.findMany({
    where: { status: "open", stage: { in: ["postpress", "shipping", "done"] } },
    orderBy: { createdAt: "asc" },
    include: { customer: true, postpress: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">ฝ่ายหลังพิมพ์</h1>
        <p className="text-sm text-slate-500">งานเคลือบ/ไดคัท/ปะกล่อง ฯลฯ ({jobs.length} งาน) — กดที่ขั้นตอนเพื่อทำเครื่องหมายเสร็จ</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ใบสั่งงาน</th>
              <th className="px-5 py-2.5 font-medium">ลูกค้า / งาน</th>
              <th className="px-5 py-2.5 text-center font-medium">จำนวน</th>
              <th className="px-5 py-2.5 font-medium">ขั้นตอน</th>
              <th className="px-5 py-2.5 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">ยังไม่มีงาน</td></tr>
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
                  {j.postpress && (
                    <ProcessChecklist endpoint="/api/postpress" id={j.postpress.id} value={j.postpress.processes} />
                  )}
                </td>
                <td className="px-5 py-3">
                  {j.postpress && (
                    <StatusSelect endpoint="/api/postpress" id={j.postpress.id} field="status" value={j.postpress.status} options={POSTPRESS_STATUS} />
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
