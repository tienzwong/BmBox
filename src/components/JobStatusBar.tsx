import Link from "next/link";
import { num } from "@/lib/format";
import { STAGE_ORDER } from "@/lib/jobs";

export interface JobStageCount {
  stage: string;
  count: number;
}

const STAGE_BAR: {
  stage: string;
  label: string;
  href: string;
  bg: string;
}[] = [
  { stage: "prepress", label: "พรีเพลส", href: "/prepress", bg: "bg-slate-700 hover:bg-slate-800" },
  { stage: "production", label: "กำลังผลิต", href: "/production", bg: "bg-red-600 hover:bg-red-700" },
  { stage: "postpress", label: "หลังพิมพ์", href: "/postpress", bg: "bg-orange-500 hover:bg-orange-600" },
  { stage: "shipping", label: "รอจัดส่ง", href: "/shipping", bg: "bg-sky-600 hover:bg-sky-700" },
  { stage: "done", label: "เสร็จสิ้น", href: "/quotations", bg: "bg-green-600 hover:bg-green-700" },
];

export default function JobStatusBar({
  stageCounts,
  estimatingCount,
  holdCount,
}: {
  stageCounts: JobStageCount[];
  estimatingCount: number;
  holdCount: number;
}) {
  const map = new Map(stageCounts.map((s) => [s.stage, s.count]));
  const activeTotal = STAGE_ORDER.reduce((sum, st) => sum + (map.get(st) ?? 0), 0) - (map.get("done") ?? 0);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">สถานะงานในระบบ</h2>
          <p className="text-xs text-slate-400">
            แยกตามขั้นตอน · งานเปิด {num(activeTotal)} ใบ
            {holdCount > 0 && ` · พักงาน ${num(holdCount)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* ใบเสนอราคารอรับงาน */}
        <Link
          href="/quotations"
          className="relative min-h-[5.5rem] overflow-hidden rounded-xl bg-slate-900 p-4 text-white shadow-sm transition hover:bg-slate-950"
        >
          <div className="absolute right-3 top-2 text-3xl font-bold tabular-nums">{num(estimatingCount)}</div>
          <div className="absolute bottom-3 left-4 right-12 text-sm font-medium leading-snug">รอรับงาน<br /><span className="text-xs font-normal text-white/80">ใบเสนอราคา</span></div>
        </Link>

        {STAGE_BAR.map((s) => {
          const count = map.get(s.stage) ?? 0;
          return (
            <Link
              key={s.stage}
              href={s.href}
              className={`relative min-h-[5.5rem] overflow-hidden rounded-xl p-4 text-white shadow-sm transition ${s.bg}`}
            >
              <div className="absolute right-3 top-2 text-3xl font-bold tabular-nums">{num(count)}</div>
              <div className="absolute bottom-3 left-4 right-12 text-sm font-medium leading-snug">{s.label}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
