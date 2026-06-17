import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { baht } from "@/lib/format";
import { estimatedCost } from "@/lib/jobs";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CostingPage() {
  const user = await requireModule("costing");
  if (!can(user.role, "viewCost")) redirect("/");

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, costEntries: true, quotation: { include: { items: true } } },
  });

  const rows = jobs.map((j) => {
    const est = j.quotation ? estimatedCost(j.quotation.items) : 0;
    const actual = j.costEntries.reduce((s, c) => s + c.amount, 0);
    return { j, est, actual, variance: actual - est };
  });

  const totEst = rows.reduce((s, r) => s + r.est, 0);
  const totActual = rows.reduce((s, r) => s + r.actual, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">บัญชีต้นทุน</h1>
        <p className="text-sm text-slate-500">เปรียบเทียบต้นทุนประมาณการกับต้นทุนจริงของแต่ละงาน</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-xs text-slate-400">ประมาณการรวม</div><div className="mt-1 text-xl font-bold text-slate-800">{baht(totEst)}</div></div>
        <div className="card p-5"><div className="text-xs text-slate-400">ต้นทุนจริงรวม</div><div className="mt-1 text-xl font-bold text-slate-800">{baht(totActual)}</div></div>
        <div className="card p-5"><div className="text-xs text-slate-400">ผลต่าง</div><div className={`mt-1 text-xl font-bold ${totActual - totEst > 0 ? "text-red-600" : "text-green-600"}`}>{baht(totActual - totEst)}</div></div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ใบสั่งงาน</th>
              <th className="px-5 py-2.5 font-medium">ลูกค้า</th>
              <th className="px-5 py-2.5 text-right font-medium">ประมาณการ</th>
              <th className="px-5 py-2.5 text-right font-medium">จริง</th>
              <th className="px-5 py-2.5 text-right font-medium">ผลต่าง</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">ยังไม่มีงาน</td></tr>
            ) : rows.map(({ j, est, actual, variance }) => (
              <tr key={j.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/costing/${j.id}`} className="font-medium text-brand-700 hover:underline">{j.code}</Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{j.customer.name}</td>
                <td className="px-5 py-3 text-right text-slate-500">{baht(est)}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">{baht(actual)}</td>
                <td className={`px-5 py-3 text-right font-medium ${variance > 0 ? "text-red-600" : "text-green-600"}`}>{baht(variance)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
