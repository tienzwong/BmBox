"use client";

import { num } from "@/lib/format";

export default function ProgressDonut({
  percent,
  done,
  remaining,
}: {
  percent: number;
  done: number;
  remaining: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="card flex flex-col items-center p-5">
      <h3 className="mb-3 w-full text-sm font-semibold text-slate-700">ความคืบหน้า</h3>
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#2563eb"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{percent}%</span>
          <span className="text-[10px] text-slate-400">เสร็จแล้ว</span>
        </div>
      </div>
      <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-lg bg-green-50 py-2">
          <div className="font-bold text-green-700">{num(done)}</div>
          <div className="text-green-600">เสร็จ</div>
        </div>
        <div className="rounded-lg bg-orange-50 py-2">
          <div className="font-bold text-orange-700">{num(remaining)}</div>
          <div className="text-orange-600">คงเหลือ</div>
        </div>
      </div>
    </div>
  );
}
