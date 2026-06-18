"use client";

import { useState } from "react";
import { baht, num } from "@/lib/format";

export interface SalesPoint {
  label: string; // เช่น "มิ.ย. 68"
  value: number;
  count: number;
}

export default function SalesChart({ data }: { data: SalesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 280;
  const padL = 64;
  const padR = 16;
  const padT = 20;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const max = Math.max(1, ...data.map((d) => d.value));
  // ปัดเพดานแกน Y ให้สวย
  const niceMax = niceCeil(max);
  const ticks = 4;

  const slot = chartW / data.length;
  const barW = Math.min(data.length > 8 ? 36 : 56, slot * 0.55);
  const labelSize = data.length > 20 ? 8 : data.length > 8 ? 9 : 11;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto" }}
        role="img"
        aria-label="กราฟยอดขายรายเดือน"
      >
        {/* เส้นกริด + ป้ายแกน Y */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (niceMax / ticks) * i;
          const y = padT + chartH - (v / niceMax) * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef2f7" strokeWidth={1} />
              <text x={padL - 10} y={y + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
                {compact(v)}
              </text>
            </g>
          );
        })}

        {/* แท่ง */}
        {data.map((d, i) => {
          const h = (d.value / niceMax) * chartH;
          const x = padL + slot * i + (slot - barW) / 2;
          const y = padT + chartH - h;
          const active = hover === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* พื้นที่รับ hover เต็มช่อง */}
              <rect x={padL + slot * i} y={padT} width={slot} height={chartH} fill="transparent" />
              <rect
                x={x}
                y={d.value > 0 ? y : padT + chartH - 2}
                width={barW}
                height={d.value > 0 ? h : 2}
                rx={5}
                fill={active ? "#1d4ed8" : "#2563eb"}
                opacity={hover === null || active ? 1 : 0.55}
              />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 7} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1e293b">
                  {compact(d.value)}
                </text>
              )}
              <text x={padL + slot * i + slot / 2} y={H - 14} textAnchor="middle" fontSize={labelSize} fill="#64748b">
                {d.label}
              </text>
            </g>
          );
        })}

        {/* เส้นฐาน */}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#cbd5e1" strokeWidth={1} />
      </svg>

      {hover !== null && (
        <div className="mt-1 text-center text-sm">
          <span className="font-medium text-slate-700">{data[hover].label}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-semibold text-brand-700">{baht(data[hover].value)}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-slate-500">{num(data[hover].count)} ใบ</span>
        </div>
      )}
    </div>
  );
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
