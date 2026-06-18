import { thaiDate } from "@/lib/format";
import { moduleIcon } from "@/lib/job-events";

export interface TimelineEvent {
  id: number;
  type: string;
  module: string;
  title: string;
  detail: string | null;
  actorName: string | null;
  createdAt: Date;
}

export default function JobTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card p-5 text-sm text-slate-400">
        ยังไม่มีประวัติเหตุการณ์ — จะบันทึกอัตโนมัติเมื่อแต่ละแผนกอัปเดตสถานะ
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">ประวัติ / Timeline</h2>
      <ol className="relative space-y-0 border-l border-line pl-5">
        {events.map((ev, i) => (
          <li key={ev.id} className="relative pb-5 last:pb-0">
            <span
              className="absolute -left-[1.35rem] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white text-xs"
              aria-hidden
            >
              {moduleIcon(ev.module)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium text-slate-800">{ev.title}</span>
                {i === 0 && (
                  <span className="badge bg-brand-50 text-brand-700">ล่าสุด</span>
                )}
              </div>
              {ev.detail && (
                <p className="mt-0.5 text-xs text-slate-500">{ev.detail}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-400">
                <span>{thaiDate(ev.createdAt, true)}</span>
                {ev.actorName && <span>โดย {ev.actorName}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
