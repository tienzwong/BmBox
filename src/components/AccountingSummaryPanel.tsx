import Link from "next/link";
import { baht, num } from "@/lib/format";
import { currentPhaseGoals, HYBRID_PHASE_GOALS } from "@/lib/accounting-goals";
import type { AccountingSummary } from "@/lib/accounting-reminders";

const SEVERITY_STYLES = {
  urgent: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
} as const;

export default function AccountingSummaryPanel({ summary }: { summary: AccountingSummary }) {
  const phaseGoal = currentPhaseGoals();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">สรุปและเตือนด้านบัญชี</h2>
          <p className="text-xs text-slate-500">
            Hybrid C · ช่วง {summary.phase} — {phaseGoal.title}
          </p>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
          GL ใน FlowAccount
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="QT รับงานแล้ว"
          value={baht(summary.acceptedQuotationTotal)}
          sub={`${num(summary.acceptedQuotationCount)} ใบ · proxy รายได้ (C0)`}
          href="/quotations?status=accepted"
        />
        <SummaryCard
          label="รอวางบิล (งานเสร็จ)"
          value={num(summary.jobsAwaitingBilling)}
          sub={summary.jobsAwaitingBillingAmount > 0 ? `≈ ${baht(summary.jobsAwaitingBillingAmount)}` : "—"}
          highlight={summary.jobsAwaitingBilling > 0}
        />
        <SummaryCard
          label="เก็บเงินเดือนนี้"
          value={summary.collectedThisMonth > 0 ? baht(summary.collectedThisMonth) : "—"}
          sub={summary.phase === "C0" ? "รอโมดูลใบเสร็จ (C1)" : "จากใบเสร็จ"}
        />
        <SummaryCard
          label="เป้าเก็บเงินเดือน"
          value={summary.monthlyTarget > 0 ? baht(summary.monthlyTarget) : "ยังไม่ตั้ง"}
          sub={
            summary.monthlyTarget > 0 && summary.collectedThisMonth === 0
              ? "ตั้ง ACCOUNTING_MONTHLY_TARGET ใน .env"
              : undefined
          }
        />
      </div>

      {summary.reminders.length > 0 && (
        <div className="card divide-y divide-line overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-600">
            การเตือน ({summary.reminders.length})
          </div>
          <ul>
            {summary.reminders.map((r) => (
              <li key={r.id} className={`border-l-4 px-4 py-3 ${SEVERITY_STYLES[r.severity]}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{r.title}</div>
                    <p className="mt-0.5 text-xs opacity-90">{r.detail}</p>
                  </div>
                  {r.href && r.actionLabel && (
                    <Link href={r.href} className="shrink-0 text-xs font-medium underline underline-offset-2">
                      {r.actionLabel}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-xs font-semibold text-slate-700">เป้าหมายแผน Hybrid C</h3>
        <div className="mt-3 space-y-3">
          {HYBRID_PHASE_GOALS.map((g) => (
            <div
              key={g.phase}
              className={`rounded-lg border px-3 py-2.5 ${
                g.phase === summary.phase ? "border-brand-300 bg-brand-50/50" : "border-line bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800">
                  {g.phase}: {g.title}
                </span>
                <span className="text-[10px] text-slate-400">{g.deadline}</span>
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {g.kpis.map((k) => (
                  <li key={k.label} className="text-[11px] text-slate-500">
                    · {k.label} → <span className="text-slate-600">{k.target}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <>
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-bold ${highlight ? "text-amber-700" : "text-slate-800"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-400">{sub}</div>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`card block p-3 transition hover:border-brand-300 ${highlight ? "ring-1 ring-amber-200" : ""}`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={`card p-3 ${highlight ? "ring-1 ring-amber-200" : ""}`}>{inner}</div>;
}
