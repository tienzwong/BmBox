import Link from "next/link";
import { num, thaiDate } from "@/lib/format";
import { JOB_STAGE } from "@/lib/labels";
import ProgressDonut from "@/components/ProgressDonut";
import {
  type ExecutiveMetrics,
  executiveInsight,
  executiveRecommendation,
} from "@/lib/dashboard-executive";

const STAGE_COLORS: Record<string, string> = {
  prepress: "bg-violet-500",
  production: "bg-red-500",
  postpress: "bg-orange-500",
  shipping: "bg-sky-500",
  done: "bg-green-500",
};

interface JobRow {
  id: number;
  code: string;
  title: string;
  stage: string;
  status: string;
  createdAt: Date;
  customer: { name: string };
  quotation: { number: string; jobType: string | null } | null;
}

export default function ExecutiveDashboard({
  metrics,
  jobs,
  showPrice,
  salesSection,
}: {
  metrics: ExecutiveMetrics;
  jobs: JobRow[];
  showPrice: boolean;
  salesSection?: React.ReactNode;
}) {
  const m = metrics;
  const insight = executiveInsight(m);
  const recommendation = executiveRecommendation(m);
  const maxStage = Math.max(1, ...m.stageCounts.map((s) => s.count));

  const workflow = [
    { label: "รับแจ้งใหม่", sub: "ใบเสนอราคา", count: m.estimatingCount, href: "/quotations", bg: "bg-slate-800 hover:bg-slate-900" },
    { label: "อยู่ระหว่างพรีเพลส", sub: null, count: m.prepressCount, href: "/prepress", bg: "bg-red-600 hover:bg-red-700" },
    { label: "อยู่ระหว่างผลิต", sub: "ผลิต·หลังพิมพ์·จัดส่ง", count: m.inProgressCount, href: "/production", bg: "bg-orange-500 hover:bg-orange-600" },
    { label: "ดำเนินการเรียบร้อย", sub: null, count: m.doneJobs, href: "/quotations", bg: "bg-green-600 hover:bg-green-700" },
  ];

  const kpis = [
    { label: "งานทั้งหมด", value: num(m.totalJobs), hint: "รวมเสนอราคา + ใบสั่งงาน" },
    { label: "คงเหลือ", value: num(m.remainingJobs), hint: "ยังไม่ปิดงาน", accent: "text-orange-600" },
    { label: "เสร็จแล้ว", value: num(m.doneJobs), hint: "ปิดงานแล้ว", accent: "text-green-600" },
    { label: "อัตราเสร็จ", value: `${m.completionRate}%`, hint: "เทียบงานทั้งหมด", accent: "text-brand-600" },
  ];

  return (
    <div className="space-y-5">
      {/* KPI row — REF style white cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-xs text-slate-400">{k.label}</div>
            <div className={`mt-1 text-3xl font-bold tabular-nums ${k.accent ?? "text-slate-800"}`}>{k.value}</div>
            <div className="mt-1 text-[10px] text-slate-400">{k.hint}</div>
          </div>
        ))}
      </div>

      {/* Workflow status bar — 4 blocks like REF */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {workflow.map((w) => (
          <Link
            key={w.label}
            href={w.href}
            className={`relative min-h-[5rem] rounded-xl p-4 text-white shadow-sm transition ${w.bg}`}
          >
            <div className="absolute right-3 top-2 text-3xl font-bold tabular-nums">{num(w.count)}</div>
            <div className="absolute bottom-3 left-4 right-10 text-sm font-medium leading-tight">
              {w.label}
              {w.sub && <span className="mt-0.5 block text-[10px] font-normal text-white/75">{w.sub}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Middle: charts + sidebar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* แผนก / stage breakdown */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">แผนก / ขั้นตอน</h3>
            <ul className="space-y-2">
              {m.stageCounts
                .filter((s) => s.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <li key={s.stage} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{JOB_STAGE[s.stage]?.label ?? s.stage}</span>
                    <span className="font-semibold tabular-nums text-slate-800">{num(s.count)}</span>
                  </li>
                ))}
              {m.stageCounts.every((s) => s.count === 0) && (
                <li className="text-sm text-slate-400">ยังไม่มีใบสั่งงาน</li>
              )}
            </ul>
          </div>

          {/* Horizontal bar — stage volume */}
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">ปริมาณงานตามขั้นตอน</h3>
            <div className="space-y-3">
              {m.stageCounts.map((s) => {
                const pct = (s.count / maxStage) * 100;
                return (
                  <div key={s.stage}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-600">{JOB_STAGE[s.stage]?.label ?? s.stage}</span>
                      <span className="font-medium text-slate-800">{num(s.count)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${STAGE_COLORS[s.stage] ?? "bg-slate-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Job type cards */}
          {m.jobTypeCounts.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">ลักษณะงานพิมพ์</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {m.jobTypeCounts.map((t) => (
                  <div key={t.label} className="rounded-lg border border-line bg-slate-50 p-3 text-center">
                    <div className="text-xl font-bold text-slate-800">{num(t.count)}</div>
                    <div className="mt-1 text-[11px] leading-snug text-slate-500">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — REF style */}
        <div className="space-y-4">
          <ProgressDonut percent={m.completionRate} done={m.doneJobs} remaining={m.remainingJobs} />

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Insight</h3>
            <p className="text-xs leading-relaxed text-slate-600">{insight}</p>
          </div>

          <div className="card bg-slate-800 p-4 text-white">
            <h3 className="mb-2 text-sm font-semibold">คำแนะนำ</h3>
            <p className="text-xs leading-relaxed text-slate-200">{recommendation}</p>
            <div className="mt-3 flex gap-2 text-[10px]">
              <span className="rounded bg-white/10 px-2 py-1">คงเหลือ {num(m.remainingJobs)}</span>
              <span className="rounded bg-white/10 px-2 py-1">พักงาน {num(m.holdCount)}</span>
            </div>
          </div>

          <Link href="/settings/architecture" className="card block p-4 transition hover:border-brand-300">
            <div className="text-xs font-medium text-brand-700">โครงสร้างระบบ & graphify</div>
            <div className="mt-1 text-[11px] text-slate-500">ดูแผนที่โมดูลและ knowledge graph</div>
          </Link>
        </div>
      </div>

      {/* Jobs table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{num(jobs.length)} รายการงานล่าสุด</h2>
          <Link href="/prepress" className="text-xs text-brand-600 hover:underline">
            เปิดบอร์ดงาน
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">ยังไม่มีใบสั่งงาน</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead className="bg-slate-50 text-left text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">เลข JOB</th>
                  <th className="px-4 py-2 font-medium">ลูกค้า</th>
                  <th className="px-4 py-2 font-medium">งาน</th>
                  <th className="px-4 py-2 font-medium">ขั้นตอน</th>
                  <th className="px-4 py-2 font-medium">สถานะ</th>
                  <th className="px-4 py-2 font-medium">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const st = JOB_STAGE[j.stage];
                  return (
                    <tr key={j.id} className="border-t border-line hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/jobs/${j.id}`} className="font-medium text-brand-700 hover:underline">
                          {j.code}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{j.customer.name}</td>
                      <td className="max-w-[10rem] truncate px-4 py-2.5 text-sm text-slate-600">{j.title}</td>
                      <td className="px-4 py-2.5">
                        <span className={`badge ${st?.cls ?? "bg-slate-100 text-slate-600"}`}>{st?.label ?? j.stage}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`badge ${j.status === "done" ? "bg-green-50 text-green-700" : j.status === "hold" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                          {j.status === "done" ? "เสร็จ" : j.status === "hold" ? "พัก" : "เปิด"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{thaiDate(j.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPrice && salesSection}
    </div>
  );
}
