"use client";

import { useCallback, useEffect, useState } from "react";
import JobProgressBar from "@/components/JobProgressBar";
import type { ProgressStep } from "@/lib/job-progress";
import type { JobTrackSummary } from "@/lib/job-track";

interface TrackPayload {
  code: string;
  title: string;
  customer: string;
  quantity: number;
  summary: JobTrackSummary;
  steps: ProgressStep[];
  quotation: { number: string; soNumber: string | null } | null;
  updatedAt: string;
}

const TONE_CLS: Record<JobTrackSummary["tone"], string> = {
  done: "bg-emerald-500 text-white",
  progress: "bg-brand-600 text-white",
  hold: "bg-amber-500 text-white",
  cancelled: "bg-slate-500 text-white",
};

export default function JobTrackClient({ code, initial }: { code: string; initial: TrackPayload }) {
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(code)}`);
      if (res.ok) setData(await res.json());
    } finally {
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  const s = data.summary;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50">
      <div className={`px-5 py-8 text-center ${TONE_CLS[s.tone]}`}>
        <div className="text-sm font-medium opacity-90">{data.code}</div>
        <div className="mt-2 text-3xl font-bold tracking-tight">{s.headline}</div>
        <div className="mt-1 text-sm opacity-90">{s.subline}</div>
        <div className="mt-4 text-xs opacity-80">ความคืบหน้า {s.percent}%</div>
      </div>

      <div className="space-y-4 p-4">
        <div className="card p-4">
          <div className="text-sm font-semibold text-slate-800">{data.title}</div>
          <div className="mt-1 text-xs text-slate-500">{data.customer}</div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>จำนวน {data.quantity.toLocaleString()} ชิ้น</span>
            {data.quotation?.soNumber && <span>SO {data.quotation.soNumber}</span>}
            {data.quotation?.number && <span>QT {data.quotation.number}</span>}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 text-xs font-medium text-slate-400">ขั้นตอนการผลิต</div>
          <JobProgressBar steps={data.steps} compact />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>อัปเดต {new Date(data.updatedAt).toLocaleString("th-TH")}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="font-medium text-brand-600 hover:underline disabled:opacity-50"
          >
            {refreshing ? "กำลังโหลด…" : "รีเฟรช"}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400">BmBox ERP · เบลสโมทีฟ จำกัด</p>
      </div>
    </div>
  );
}
