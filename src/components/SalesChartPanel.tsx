"use client";

import { useState } from "react";
import SalesChart, { type SalesPoint } from "@/components/SalesChart";
import { baht } from "@/lib/format";
import { currentMonthLabel, salesTotal } from "@/lib/sales-chart";

type Range = "1m" | "6m" | "1y";

const RANGE_META: Record<Range, { title: string; subtitle: string; btn: string }> = {
  "1m": {
    title: "ยอดขายรายวัน",
    subtitle: `เดือน${currentMonthLabel()} · มูลค่าจากใบเสนอราคาที่รับงานแล้ว`,
    btn: "1 เดือน",
  },
  "6m": {
    title: "ยอดขายรายเดือน",
    subtitle: "6 เดือนล่าสุด · มูลค่าจากใบเสนอราคาที่รับงานแล้ว",
    btn: "6 เดือน",
  },
  "1y": {
    title: "ยอดขายรายเดือน",
    subtitle: "12 เดือนล่าสุด · มูลค่าจากใบเสนอราคาที่รับงานแล้ว",
    btn: "1 ปี",
  },
};

export default function SalesChartPanel({
  data1m,
  data6m,
  data1y,
}: {
  data1m: SalesPoint[];
  data6m: SalesPoint[];
  data1y: SalesPoint[];
}) {
  const [range, setRange] = useState<Range>("6m");
  const data = range === "1m" ? data1m : range === "6m" ? data6m : data1y;
  const total = salesTotal(data);
  const meta = RANGE_META[range];

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{meta.title}</h2>
          <p className="text-xs text-slate-400">{meta.subtitle}</p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex rounded-lg border border-line bg-slate-50 p-0.5">
            {(["1m", "6m", "1y"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === key ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {RANGE_META[key].btn}
              </button>
            ))}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">รวมในช่วง</div>
            <div className="text-lg font-bold text-brand-700">{baht(total)}</div>
          </div>
        </div>
      </div>
      <SalesChart data={data} />
    </div>
  );
}
