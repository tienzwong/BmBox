"use client";

import { useState } from "react";
import SalesChart, { type SalesPoint } from "@/components/SalesChart";
import { baht } from "@/lib/format";
import { currentMonthLabel, salesTotal } from "@/lib/sales-chart";

type Range = "1m" | "6m" | "1y";

const RANGE_META: Record<Range, { title: string; subtitle: string; btn: string; mobileBtn: string }> = {
  "1m": {
    title: "ยอดขายรายวัน",
    subtitle: `เดือน${currentMonthLabel()} · มูลค่าจากใบเสนอราคาที่รับงานแล้ว`,
    btn: "1 เดือน",
    mobileBtn: "เดือนนี้",
  },
  "6m": {
    title: "ยอดขายรายเดือน",
    subtitle: "6 เดือนล่าสุด · มูลค่าจากใบเสนอราคาที่รับงานแล้ว",
    btn: "6 เดือน",
    mobileBtn: "6 เดือน",
  },
  "1y": {
    title: "ยอดขายรายเดือน",
    subtitle: "12 เดือนล่าสุด · มูลค่าจากใบเสนอราคาที่รับงานแล้ว",
    btn: "1 ปี",
    mobileBtn: "1 ปี",
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
  const [range, setRange] = useState<Range>("1y");
  const data = range === "1m" ? data1m : range === "6m" ? data6m : data1y;
  const total = salesTotal(data);
  const meta = RANGE_META[range];
  const maxBar = Math.max(1, ...data.map((d) => d.value));
  const fillPct = Math.round((total / (maxBar * data.length || 1)) * 100);

  return (
    <div className="-mx-4 bg-white md:mx-0 md:rounded-xl md:border md:border-line md:shadow-sm">
      {/* Mobile tab bar — FlowAccount style */}
      <div className="flex border-b border-line md:hidden">
        <span className="flex-1 border-b-2 border-brand-600 py-3.5 text-center text-sm font-semibold text-brand-600">
          ยอดขาย
        </span>
      </div>

      <div className="px-4 pt-4 md:p-5 md:pt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 md:text-sm md:font-semibold md:text-slate-700">
              <span className="md:hidden">สรุปยอดขาย</span>
              <span className="hidden md:inline">{meta.title}</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">{meta.subtitle}</p>
          </div>

          {/* Desktop controls */}
          <div className="hidden items-end gap-4 md:flex">
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

        {/* Mobile pill filters */}
        <div className="mb-3 flex gap-2 md:hidden">
          {(["1m", "6m", "1y"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`min-h-[44px] flex-1 rounded-full px-3 py-2.5 text-[15px] font-semibold transition ${
                range === key ? "bg-brand-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"
              }`}
            >
              {RANGE_META[key].mobileBtn}
            </button>
          ))}
        </div>

        <SalesChart data={data} />

        {/* Mobile summary — FlowAccount style */}
        <div className="mt-4 border-t border-line pt-4 md:hidden">
          <div className="text-sm text-slate-500">รายได้รวม</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{baht(total)}</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(8, fillPct))}%` }}
            />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm text-slate-500">ยอดในช่วงที่เลือก</span>
            <span className="text-lg font-bold text-brand-600">{baht(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
