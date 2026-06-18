import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { baht, num, thaiDate } from "@/lib/format";
import SalesChartPanel from "@/components/SalesChartPanel";
import JobStatusBar from "@/components/JobStatusBar";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";
import { buildExecutiveMetrics } from "@/lib/dashboard-executive";
import { dailySalesCurrentMonth, monthlySales } from "@/lib/sales-chart";
import { requireUser } from "@/lib/auth/session";
import { can, isRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const showPrice = can(user.role, "viewPrice");
  const isExecutive = isRole(user.role) && (user.role === "admin" || user.role === "management");

  const [
    qCount,
    pCount,
    cCount,
    sumAgg,
    recent,
    allForChart,
    jobStageGroups,
    estimatingCount,
    holdCount,
    recentJobs,
    activeJobsForTypes,
  ] = await Promise.all([
    prisma.quotation.count({ where: { isPattern: false } }),
    prisma.paper.count({ where: { active: true } }),
    prisma.customer.count(),
    prisma.quotation.aggregate({ _sum: { total: true }, where: { isPattern: false, status: "accepted" } }),
    prisma.quotation.findMany({
      where: { isPattern: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true },
    }),
    prisma.quotation.findMany({ where: { isPattern: false, status: "accepted" }, select: { issueDate: true, total: true } }),
    prisma.job.groupBy({
      by: ["stage"],
      where: { status: { not: "cancelled" } },
      _count: { id: true },
    }),
    prisma.quotation.count({ where: { isPattern: false, status: "estimating" } }),
    prisma.job.count({ where: { status: "hold" } }),
    prisma.job.findMany({
      where: { status: { not: "cancelled" } },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        customer: true,
        quotation: { select: { number: true, jobType: true } },
      },
    }),
    prisma.job.findMany({
      where: { status: { not: "cancelled" }, stage: { not: "done" } },
      include: { quotation: { select: { jobType: true } } },
    }),
  ]);

  const stageCounts = jobStageGroups.map((g) => ({ stage: g.stage, count: g._count.id }));
  const chart1m = dailySalesCurrentMonth(allForChart);
  const chart6m = monthlySales(allForChart, 6);
  const chart1y = monthlySales(allForChart, 12);

  const salesChart = <SalesChartPanel data1m={chart1m} data6m={chart6m} data1y={chart1y} />;

  if (isExecutive) {
    const metrics = buildExecutiveMetrics({
      stageCounts,
      estimatingCount,
      holdCount,
      jobs: activeJobsForTypes,
    });

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard ผู้บริหาร</h1>
            <p className="text-sm text-slate-500">BmBox ERP — ภาพรวมงานและสถานะทุกแผนก</p>
          </div>
          <div className="flex gap-2">
            <Link href="/quotations/new" className="btn-primary text-xs">
              + สร้างใบเสนอราคา
            </Link>
            <Link href="/settings/architecture" className="btn-outline text-xs">
              โครงสร้างระบบ
            </Link>
          </div>
        </div>

        <ExecutiveDashboard
          metrics={metrics}
          jobs={recentJobs}
          showPrice={showPrice}
          salesChart={showPrice ? salesChart : undefined}
        />
      </div>
    );
  }

  const stats = [
    { label: "ใบเสนอราคา", value: num(qCount), href: "/quotations" },
    ...(showPrice ? [{ label: "มูลค่ารวม", value: baht(sumAgg._sum.total ?? 0), href: "/quotations" }] : []),
    { label: "ชนิดกระดาษ", value: num(pCount), href: "/papers" },
    { label: "ลูกค้า", value: num(cCount), href: "/contacts?tab=customer" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">ภาพรวม</h1>
        <p className="text-sm text-slate-500">BmBox ERP — เบลสโมทีฟ จำกัด</p>
      </div>

      <JobStatusBar stageCounts={stageCounts} estimatingCount={estimatingCount} holdCount={holdCount} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 transition hover:border-brand-300">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{s.value}</div>
          </Link>
        ))}
      </div>

      {showPrice && salesChart}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">ใบเสนอราคาล่าสุด</h2>
          <Link href="/quotations" className="text-xs text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            ยังไม่มีใบเสนอราคา ·{" "}
            <Link href="/quotations/new" className="text-brand-600 hover:underline">
              สร้างใบแรก
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead className="bg-slate-50 text-left text-xs text-slate-400">
                <tr>
                  <th className="px-5 py-2 font-medium">เลขที่</th>
                  <th className="px-5 py-2 font-medium">ลูกค้า</th>
                  <th className="px-5 py-2 font-medium">วันที่</th>
                  {showPrice && <th className="px-5 py-2 text-right font-medium">ยอดรวม</th>}
                </tr>
              </thead>
              <tbody>
                {recent.map((q) => (
                  <tr key={q.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/quotations/${q.id}`} className="font-medium text-brand-700 hover:underline">
                        {q.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{q.customer.name}</td>
                    <td className="px-5 py-3 text-slate-500">{thaiDate(q.issueDate)}</td>
                    {showPrice && <td className="px-5 py-3 text-right font-medium text-slate-700">{baht(q.total)}</td>}
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
