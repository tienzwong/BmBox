"use client";

import Link from "next/link";
import { useState } from "react";

const SAMPLE = {
  title: "กล่องบรรจุภัณฑ์ ABC",
  jobType: "กล่องกระดาษลูกฟูก",
  spec: `กระดาษลูกฟูก E-flute 350gsm
พิมพ์ 4 สี หน้าเดียว + เคลือบด้าน
ไดคัท + ปะกล่อง
ขนาดกล่องพับแล้ว 9 × 5.4 × 12 ซม.`,
  pieceW: "9.0",
  pieceH: "5.4",
  bleed: "0.3",
  colorsFront: "4",
  colorsBack: "0",
  perimeterCm: "86",
  knifeCount: "1",
};

const BLANK = {
  title: "",
  jobType: "",
  spec: "",
  pieceW: "",
  pieceH: "",
  bleed: "0.3",
  colorsFront: "4",
  colorsBack: "0",
  perimeterCm: "",
  knifeCount: "1",
};

const DIMENSION_FIELDS = [
  {
    key: "PIECE_W",
    th: "กว้างชิ้นงาน",
    desc: "ความกว้างชิ้นงานที่พิมพ์/ไดคัท (ซม.) — วัดจาก die flat หรือ artboard หลังกางแบบ",
    example: "9.0",
    import: "→ ฟิลด์ pieceW ในใบเสนอราคา · ใช้คำนวณการวางชิ้นบนแผ่น",
  },
  {
    key: "PIECE_H",
    th: "สูงชิ้นงาน",
    desc: "ความสูงชิ้นงาน (ซม.) — คู่กับ PIECE_W",
    example: "5.4",
    import: "→ ฟิลด์ pieceH · ใช้จัด imposition",
  },
  {
    key: "BLEED",
    th: "Bleed",
    desc: "ขอบเลย (ซม.) รอบ artwork — ป้องกันขอบขาวหลังตัด ค่ามาตรฐาน 0.3",
    example: "0.3",
    import: "→ ฟิลด์ bleed · ขยาย cell ตอนคำนวณ layout",
  },
  {
    key: "COLORS_F",
    th: "สีหน้า",
    desc: "จำนวนสีพิมพ์ด้านหน้า (เช่น 4 = CMYK, 1 = ดำ)",
    example: "4",
    import: "→ colorsFront · คิดค่าเพลท + ค่าพิมพ์",
  },
  {
    key: "COLORS_B",
    th: "สีหลัง",
    desc: "จำนวนสีพิมพ์ด้านหลัง — ใส่ 0 ถ้าไม่พิมพ์หลัง",
    example: "0",
    import: "→ colorsBack",
  },
  {
    key: "PERIMETER_CM",
    th: "ความยาวไดคัท",
    desc: "ความยาวรอบเส้นมีดไดคัทรวมทุกเส้น (ซม.) — อ่านจาก Document Info ใน Illustrator หรือรวม path length",
    example: "86",
    import: "→ คำนวณต้นทุนไดคัท: 1,500 + (perimeter × 8 × knife)",
  },
  {
    key: "KNIFE",
    th: "จำนวนมีด",
    desc: "จำนวนชุดมีด/รูปแบบตัดในแบบ — ส่วนใหญ่ใส่ 1",
    example: "1",
    import: "→ คูณกับ PERIMETER_CM ในสูตรไดคัท",
  },
] as const;

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div
        className={`mt-0.5 min-h-[1.25rem] border-b border-slate-300 text-sm text-slate-800 ${wide ? "whitespace-pre-wrap py-1" : ""}`}
      >
        {value || "\u00A0"}
      </div>
    </div>
  );
}

function DielineSample() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="304" height="184" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <path
        d="M 40 40 H 280 V 160 H 40 Z M 40 90 H 280 M 120 40 V 160 M 200 40 V 160"
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeDasharray="6 3"
      />
      <text x="160" y="100" textAnchor="middle" fontSize="11" fill="#64748b">
        Dieline (เส้นไดคัท)
      </text>
      <text x="160" y="118" textAnchor="middle" fontSize="9" fill="#94a3b8">
        Export เป็น vector ใน PDF
      </text>
    </svg>
  );
}

function ProductSample({ blank }: { blank: boolean }) {
  if (blank) {
    return (
      <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
        <div className="text-2xl opacity-40">🖼</div>
        <div className="mt-1 font-medium">รูป Mock-up / สินค้า</div>
        <div className="mt-0.5 px-4">วางภาพบน Artboard หรือหน้า PDF</div>
      </div>
    );
  }
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded border border-slate-200 bg-gradient-to-b from-brand-50 to-white">
      <div className="text-4xl">📦</div>
      <div className="mt-2 text-sm font-semibold text-slate-700">กล่อง ABC</div>
      <div className="text-xs text-slate-500">Mock-up ตัวอย่าง</div>
    </div>
  );
}

function TemplateSheet({ data, blank }: { data: typeof SAMPLE; blank: boolean }) {
  const jsonBlock = JSON.stringify(
    {
      version: 1,
      title: data.title || undefined,
      jobType: data.jobType || undefined,
      spec: data.spec || undefined,
      items: [
        {
          description: data.title || undefined,
          pieceW: data.pieceW ? Number(data.pieceW) : undefined,
          pieceH: data.pieceH ? Number(data.pieceH) : undefined,
          bleed: data.bleed ? Number(data.bleed) : undefined,
          colorsFront: data.colorsFront ? Number(data.colorsFront) : undefined,
          colorsBack: data.colorsBack ? Number(data.colorsBack) : undefined,
        },
      ],
      packaging: {
        dieline: {
          perimeterCm: data.perimeterCm ? Number(data.perimeterCm) : undefined,
          knifeCount: data.knifeCount ? Number(data.knifeCount) : undefined,
        },
      },
    },
    null,
    2
  );

  return (
    <div className="packaging-template-sheet mx-auto bg-white text-slate-800 shadow-lg print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-brand-600 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-600 text-sm font-bold text-white">
            Bm
          </div>
          <div>
            <div className="text-base font-bold text-slate-800">Final Packaging — Import Template</div>
            <div className="text-[10px] text-slate-500">BmBox ERP · บริษัท เบลสโมทีฟ จำกัด · รูปแบบ PDF v1</div>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-400">
          <div>BMBOXPACK:v1</div>
          <div>{blank ? "แบบฟอร์มว่าง" : "ตัวอย่างที่กรอกแล้ว"}</div>
        </div>
      </div>

      {/* Meta fields */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="TITLE — ชื่องาน" value={data.title} />
        <Field label="JOBTYPE — ลักษณะงาน" value={data.jobType} />
      </div>

      {/* Visual row */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            IMAGE — รูปสินค้า / Mock-up
          </div>
          <ProductSample blank={blank} />
        </div>
        <div>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            DIELINE — เส้นไดคัท (Vector)
          </div>
          <div className="min-h-[140px] rounded border border-slate-200 bg-slate-50 p-1">
            {blank ? (
              <div className="flex h-full min-h-[132px] items-center justify-center border-2 border-dashed border-slate-300 text-xs text-slate-400">
                วางเส้นไดคัท vector ที่นี่
              </div>
            ) : (
              <DielineSample />
            )}
          </div>
        </div>
      </div>

      {/* Spec */}
      <div className="mt-4">
        <Field label="SPEC — รายละเอียด Spec (ข้อความ)" value={data.spec} wide />
      </div>

      {/* Dimensions table */}
      <div className="mt-4">
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          DIMENSIONS — ขนาดชิ้นงาน (หน่วย: ซม.)
        </div>
        <p className="mb-2 text-[8px] leading-snug text-slate-500">
          กรอกตัวเลขในตารางด้านล่าง — BmBox จะนำไปเติมฟอร์มประเมินราคาและคำนวณ layout / ต้นทุนไดคัทอัตโนมัติ
        </p>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-500">
              {DIMENSION_FIELDS.map((f) => (
                <th key={f.key} className="border border-slate-200 px-1.5 py-1.5 align-top">
                  <div className="font-semibold">{f.key}</div>
                  <div className="mt-0.5 text-[7px] font-normal normal-case text-slate-400">{f.th}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="font-mono text-slate-800">
              <td className="border border-slate-200 px-2 py-2">{data.pieceW || "—"}</td>
              <td className="border border-slate-200 px-2 py-2">{data.pieceH || "—"}</td>
              <td className="border border-slate-200 px-2 py-2">{data.bleed || "—"}</td>
              <td className="border border-slate-200 px-2 py-2">{data.colorsFront || "—"}</td>
              <td className="border border-slate-200 px-2 py-2">{data.colorsBack || "—"}</td>
              <td className="border border-slate-200 px-2 py-2">{data.perimeterCm || "—"}</td>
              <td className="border border-slate-200 px-2 py-2">{data.knifeCount || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* คำอธิบายแต่ละคอลัมน์ — แสดงบน template เมื่อพิมพ์/PDF */}
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[7px] leading-snug text-slate-500">
          {DIMENSION_FIELDS.map((f) => (
            <div key={f.key}>
              <span className="font-semibold text-slate-600">{f.key}</span>
              <span className="text-slate-400"> ({f.th})</span>
              {" — "}
              {f.desc}
              {!blank && f.example && (
                <span className="text-brand-600"> · ตัวอย่าง: {f.example}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[8px] text-amber-800">
          <span className="font-semibold">PERIMETER_CM สำคัญที่สุดสำหรับต้นทุนไดคัท</span>
          {" — "}
          ใน Illustrator: เลือกเส้นไดคัททั้งหมด → Window → Document Info → เลือก Objects → ดู Path Length (แปลงเป็น cm)
          หรือใช้ปลั๊กอินรวมความยาว path · สูตร BmBox: 1,500 บาท (บล็อก) + PERIMETER_CM × 8 × KNIFE
        </p>
      </div>

      {/* Machine-readable footer */}
      <div className="mt-4 rounded border border-dashed border-brand-200 bg-brand-50/40 p-2">
        <div className="text-[9px] font-semibold uppercase tracking-wide text-brand-700">
          Metadata block (สำหรับ import อัตโนมัติ — อย่าลบ)
        </div>
        <pre className="mt-1 max-h-24 overflow-hidden text-[7px] leading-tight text-slate-600 print:max-h-none">
          {`<!--BMBOXPACK:v1-->\n${jsonBlock}`}
        </pre>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-2 text-[8px] text-slate-400">
        Export จาก Illustrator / InDesign เป็น PDF · เก็บ label ตามชื่อฟิลด์ · หรือแนบ JSON block ด้านบนในเลเยอร์ข้อความ
      </div>
    </div>
  );
}

export default function PackagingTemplateClient() {
  const [mode, setMode] = useState<"sample" | "blank">("sample");

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .packaging-template-print-area,
          .packaging-template-print-area * {
            visibility: visible;
          }
          .packaging-template-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .packaging-template-sheet {
            box-shadow: none !important;
            width: 210mm;
            min-height: 297mm;
            padding: 12mm 14mm;
            margin: 0 auto;
          }
        }
        .packaging-template-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 12mm 14mm;
        }
      `}</style>

      <div className="mb-6 print:hidden">
        <Link href="/quotations/new" className="text-sm text-brand-600 hover:underline">
          ← กลับไปสร้างใบเสนอราคา
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-800">Template Final Packaging (PDF)</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          ใช้เลย์เอาต์นี้เป็นแบบเมื่อ Export จากโปรแกรมออกแบบเป็น PDF — ระบบจะอ่าน label ฟิลด์ · รูป · เส้น vector · Spec
          และคำนวณต้นทุนไดคัทจาก PERIMETER_CM
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={mode === "sample" ? "btn-primary text-sm" : "btn-outline text-sm"}
            onClick={() => setMode("sample")}
          >
            ตัวอย่างที่กรอกแล้ว
          </button>
          <button
            type="button"
            className={mode === "blank" ? "btn-primary text-sm" : "btn-outline text-sm"}
            onClick={() => setMode("blank")}
          >
            แบบฟอร์มว่าง
          </button>
          <button type="button" className="btn-outline text-sm" onClick={() => window.print()}>
            พิมพ์ / Save as PDF
          </button>
        </div>

        <div className="mt-6 card max-w-2xl p-4 text-sm text-slate-600">
          <div className="font-semibold text-slate-700">วิธีใช้กับ Illustrator / InDesign</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
            <li>สร้าง Artboard ขนาด A4 (210 × 297 mm)</li>
            <li>วาง Mock-up โซนซ้าย · เส้นไดคัท vector โซนขวา</li>
            <li>ใส่ข้อความ label ตามชื่อฟิลด์: <code className="rounded bg-slate-100 px-1">TITLE:</code>{" "}
              <code className="rounded bg-slate-100 px-1">SPEC:</code>{" "}
              <code className="rounded bg-slate-100 px-1">PIECE_W_CM:</code> ฯลฯ</li>
            <li>คำนวณความยาวรอบเส้นไดคัท → ใส่ <code className="rounded bg-slate-100 px-1">PERIMETER_CM</code></li>
            <li>Export เป็น PDF (Preserve editing / เก็บ vector)</li>
            <li>นำ PDF เข้า BmBox ที่หน้าสร้างใบเสนอราคา (รองรับเร็วๆ นี้)</li>
          </ol>

          <div className="mt-4 border-t border-line pt-3">
            <div className="text-xs font-semibold text-slate-700">ตาราง DIMENSIONS — ความหมายแต่ละช่อง</div>
            <dl className="mt-2 space-y-2 text-xs">
              {DIMENSION_FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt className="font-mono font-semibold text-brand-700">{f.key}</dt>
                  <dd>
                    <span className="font-medium text-slate-700">{f.th}</span>
                    {" — "}
                    {f.desc}
                    <span className="mt-0.5 block text-slate-400">{f.import}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-3 text-xs text-amber-700">
            ตอนนี้ import ได้จากไฟล์ <code className="rounded bg-amber-50 px-1">.bmboxpack.json</code> — PDF parser อยู่ระหว่างพัฒนา
          </p>
        </div>
      </div>

      <div className="packaging-template-print-area flex justify-center pb-12 print:pb-0">
        <TemplateSheet data={mode === "sample" ? SAMPLE : BLANK} blank={mode === "blank"} />
      </div>
    </>
  );
}
