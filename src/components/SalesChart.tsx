"use client";

import { useEffect, useState } from "react";
import { baht, num } from "@/lib/format";

export interface SalesPoint {
  label: string; // เช่น "มิ.ย. 68"
  value: number;
  count: number;
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / mag;
  let step = 1;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 2.5) step = 2.5;
  else if (norm <= 5) step = 5;
  else step = 10;
  return step * mag;
}

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "ล.";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "พ.";
  return num(n);
}

function xLabel(label: string, isMobile: boolean, pointCount: number): string {
  if (!isMobile) return label;
  if (pointCount > 6) {
    const parts = label.split(" ");
    return parts[0] ?? label;
  }
  return label;
}

function showXLabel(index: number, total: number, isMobile: boolean): boolean {
  if (!isMobile) {
    if (total > 20) return index % 3 === 0 || index === total - 1;
    return true;
  }
  if (total <= 8) return true;
  if (total <= 12) return index % 2 === 0 || index === total - 1;
  const step = 5;
  return index === 0 || index === total - 1 || (index + 1) % step === 0;
}

export default function SalesChart({ data }: { data: SalesPoint[] }) {
  const isMobile = useIsMobile();
  const [active, setActive] = useState<number | null>(null);

  const W = isMobile ? 390 : 720;
  const H = isMobile ? 260 : 280;
  const padL = isMobile ? 52 : 64;
  const padR = isMobile ? 8 : 16;
  const padT = isMobile ? 16 : 20;
  const padB = isMobile ? 40 : 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const ticks = isMobile ? 3 : 4;

  const slot = chartW / Math.max(data.length, 1);
  const barW = Math.min(isMobile ? (data.length > 12 ? 14 : 22) : data.length > 8 ? 36 : 56, slot * (isMobile ? 0.72 : 0.55));

  const axisFont = isMobile ? 13 : 11;
  const labelFont = isMobile ? 13 : data.length > 20 ? 9 : data.length > 8 ? 10 : 11;
  const valueFont = isMobile ? 12 : 11;
  const showBarValues = !isMobile || data.length <= 12;

  const activePoint = active !== null ? data[active] : null;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-manipulation"
        style={{ height: "auto", minHeight: isMobile ? 200 : undefined }}
        role="img"
        aria-label="กราฟยอดขาย"
      >
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (niceMax / ticks) * i;
          const y = padT + chartH - (v / niceMax) * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef2f7" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={axisFont} fill="#64748b">
                {compact(v)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const h = (d.value / niceMax) * chartH;
          const x = padL + slot * i + (slot - barW) / 2;
          const y = padT + chartH - h;
          const isActive = active === i;
          const cx = padL + slot * i + slot / 2;

          return (
            <g
              key={i}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onTouchStart={(e) => {
                e.preventDefault();
                setActive(i);
              }}
            >
              <rect x={padL + slot * i} y={padT} width={slot} height={chartH} fill="transparent" />
              <rect
                x={x}
                y={d.value > 0 ? y : padT + chartH - 2}
                width={barW}
                height={d.value > 0 ? Math.max(h, isMobile ? 4 : 2) : 2}
                rx={isMobile ? 4 : 5}
                fill={isActive ? "#1d4ed8" : "#2563eb"}
                opacity={active === null || isActive ? 1 : 0.5}
              />
              {d.value > 0 && showBarValues && (
                <text
                  x={x + barW / 2}
                  y={y - (isMobile ? 5 : 7)}
                  textAnchor="middle"
                  fontSize={valueFont}
                  fontWeight={600}
                  fill="#1e293b"
                >
                  {compact(d.value)}
                </text>
              )}
              {showXLabel(i, data.length, isMobile) && (
                <text x={cx} y={H - (isMobile ? 10 : 14)} textAnchor="middle" fontSize={labelFont} fill="#475569">
                  {xLabel(d.label, isMobile, data.length)}
                </text>
              )}
            </g>
          );
        })}

        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#cbd5e1" strokeWidth={1} />
      </svg>

      {(activePoint || isMobile) && active !== null && activePoint && (
        <div
          className={`mt-2 rounded-lg px-3 py-2.5 text-center ${
            isMobile ? "bg-brand-50 text-base" : "text-sm"
          }`}
        >
          <span className={`font-semibold text-slate-800 ${isMobile ? "text-base" : ""}`}>{activePoint.label}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span className={`font-bold text-brand-700 ${isMobile ? "text-lg" : "font-semibold"}`}>
            {baht(activePoint.value)}
          </span>
          <span className="mx-2 text-slate-300">·</span>
          <span className={`text-slate-600 ${isMobile ? "text-sm" : "text-slate-500"}`}>
            {num(activePoint.count)} ใบ
          </span>
        </div>
      )}

      {isMobile && active === null && data.length > 0 && (
        <p className="mt-2 text-center text-xs text-slate-400">แตะแท่งกราฟเพื่อดูรายละเอียด</p>
      )}
    </div>
  );
}
