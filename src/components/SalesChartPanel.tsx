"use client";

import { useState } from "react";
import SalesChart, { type SalesPoint } from "@/components/SalesChart";
import { baht } from "@/lib/format";
import { salesTotal } from "@/lib/sales-chart";

type Range = "6m" | "1y";

export default function SalesChartPanel({
  data6m,
  data1y,
}: {
  data6m: SalesPoint[];
  data1y: SalesPoint[];
}) {
  const [range, setRange] = useState<Range>("6m");
  const data = range === "6m" ? data6m : data1y;
  const total = salesTotal(data);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">ยอดขายรายเดือน</h2>
          <p className="text-xs text-slate-400">
            {range === "6m" ? "6 เดือนล่าสุด" : "12 เดือนล่าสุด"} · มูลค่าจากใบเสนอราคาที่รับงานแล้ว
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex rounded-lg border border-line bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setRange("6m")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                range === "6m" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              6 เดือน
            </button>
            <button
              type="button"
              onClick={() => setRange("1y")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                range === "1y" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              1 ปี
            </button>
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
