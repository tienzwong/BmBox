"use client";

import type { ImpositionResult } from "@/lib/imposition";

export default function SheetView({
  result,
  className = "",
}: {
  result: ImpositionResult;
  className?: string;
}) {
  const { sheetW, sheetH, rects, offsetX, offsetY, usableW, usableH } = result;
  if (sheetW <= 0 || sheetH <= 0) return null;

  const PAD = 6;
  const maxDim = 360;
  const scale = maxDim / Math.max(sheetW, sheetH);
  const vw = sheetW * scale + PAD * 2;
  const vh = sheetH * scale + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      className={className}
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label="แผนผังการวางชิ้นงานบนแผ่นกระดาษ"
    >
      {/* แผ่นกระดาษ */}
      <rect
        x={PAD}
        y={PAD}
        width={sheetW * scale}
        height={sheetH * scale}
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth={1}
        rx={3}
      />
      {/* พื้นที่ใช้งานได้ (หลังหักขอบ/ขอบคาบ) */}
      <rect
        x={PAD + offsetX * scale}
        y={PAD + offsetY * scale}
        width={usableW * scale}
        height={usableH * scale}
        fill="none"
        stroke="#e2e8f0"
        strokeDasharray="4 3"
        strokeWidth={1}
      />
      {/* ชิ้นงาน */}
      {rects.map((r, i) => (
        <rect
          key={i}
          x={PAD + r.x * scale}
          y={PAD + r.y * scale}
          width={r.w * scale}
          height={r.h * scale}
          fill={r.rotated ? "#bfdbfe" : "#dbeafe"}
          stroke="#2563eb"
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
}
