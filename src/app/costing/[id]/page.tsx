import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { baht, thaiDate } from "@/lib/format";
import { estimatedCost } from "@/lib/jobs";
import { COST_CATEGORY } from "@/lib/labels";
import CostEntryForm from "@/components/CostEntryForm";

export const dynamic = "force-dynamic";

export default async function CostingDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModule("costing");
  if (!can(user.role, "viewCost")) redirect("/");

  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id: Number(id) },
    include: { customer: true, costEntries: { orderBy: { createdAt: "desc" } }, quotation: { include: { items: true } } },
  });
  if (!job) notFound();

  const est = job.quotation ? estimatedCost(job.quotation.items) : 0;
  const actual = job.costEntries.reduce((s, c) => s + c.amount, 0);
  const variance = actual - est;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/costing" className="text-sm text-brand-600 hover:underline">← กลับ</Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-slate-800">{job.code}</div>
            <div className="text-sm text-slate-500">{job.customer.name} · {job.title}</div>
          </div>
          <Link href={`/jobs/${job.id}`} className="text-xs text-brand-600 hover:underline">ดูใบสั่งงาน</Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">ประมาณการ</div><div className="font-bold text-slate-700">{baht(est)}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">ต้นทุนจริง</div><div className="font-bold text-slate-700">{baht(actual)}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">ผลต่าง</div><div className={`font-bold ${variance > 0 ? "text-red-600" : "text-green-600"}`}>{baht(variance)}</div></div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">บันทึกต้นทุนจริง</h2>
        <CostEntryForm jobId={job.id} />
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">หมวด</th>
              <th className="px-5 py-2.5 font-medium">หมายเหตุ</th>
              <th className="px-5 py-2.5 text-right font-medium">จำนวนเงิน</th>
              <th className="px-5 py-2.5 font-medium">วันที่</th>
            </tr>
          </thead>
          <tbody>
            {job.costEntries.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีรายการต้นทุน</td></tr>
            ) : job.costEntries.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-5 py-3 text-slate-700">{COST_CATEGORY[c.category] ?? c.category}</td>
                <td className="px-5 py-3 text-slate-500">{c.note ?? "-"}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">{baht(c.amount)}</td>
                <td className="px-5 py-3 text-xs text-slate-400">{thaiDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
