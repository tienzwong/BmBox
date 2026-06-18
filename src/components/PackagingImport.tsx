"use client";

import { useRef, useState } from "react";
import { parsePackagingFile, type PackagingImportResult } from "@/lib/packaging-import";
import { baht } from "@/lib/format";

export type { PackagingImportResult };

interface Props {
  onImport: (result: PackagingImportResult) => void;
}

export default function PackagingImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PackagingImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError("");
    setLoading(true);
    try {
      if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
        throw new Error("PDF import กำลังพัฒนา — ใช้ Template ที่ /quotations/packaging-template แล้ว Export เป็น JSON ก่อน หรือรออัปเดตถัดไป");
      }
      const text = await file.text();
      const result = parsePackagingFile(text, file.name);
      setPreview(result);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อ่านไฟล์ไม่สำเร็จ");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!preview) return;
    onImport(preview);
    setPreview(null);
    setOpen(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand-800">Import Final Packaging</div>
          <p className="mt-0.5 text-xs text-slate-500">
            นำเข้าไฟล์ <code className="rounded bg-white px-1">.bmboxpack.json</code> หรือ PDF (เร็วๆ นี้) — รูปสินค้า · เส้นไดคัท · Spec อัตโนมัติ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json,.bmboxpack,application/json,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="btn-primary text-xs" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? "กำลังอ่าน…" : "เลือกไฟล์"}
          </button>
          <a href="/quotations/packaging-template" className="btn-outline text-xs">
            ดู Template PDF
          </a>
          <a href="/samples/final-packaging.example.json" download className="btn-outline text-xs">
            JSON ตัวอย่าง
          </a>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      {open && preview && (
        <div className="mt-4 rounded-lg border border-line bg-white p-4">
          <div className="mb-3 text-sm font-medium text-slate-700">ตรวจสอบก่อนนำเข้า: {preview.title}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {preview.imageDataUrl ? (
              <div>
                <div className="label">รูปสินค้า</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.imageDataUrl} alt={preview.imageName ?? "product"} className="max-h-40 rounded border border-line object-contain" />
              </div>
            ) : (
              <div className="flex items-center justify-center rounded border border-dashed border-line bg-slate-50 p-6 text-xs text-slate-400">
                ไม่มีรูภาพในไฟล์
              </div>
            )}
            {preview.dielineSvg ? (
              <div>
                <div className="label">เส้นไดคัท</div>
                <div className="rounded border border-line bg-slate-50 p-2" dangerouslySetInnerHTML={{ __html: preview.dielineSvg }} />
                {preview.dieCutCost != null && (
                  <p className="mt-1 text-xs text-slate-500">ต้นทุนไดคัทประมาณ: {baht(preview.dieCutCost)}</p>
                )}
              </div>
            ) : null}
          </div>
          {preview.specDetail && (
            <div className="mt-3">
              <div className="label">Spec</div>
              <pre className="max-h-32 overflow-auto rounded bg-slate-50 p-2 text-xs whitespace-pre-wrap text-slate-600">{preview.specDetail}</pre>
            </div>
          )}
          {preview.warnings.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-amber-700">
              {preview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-primary text-sm" onClick={apply}>
              นำเข้าฟอร์ม
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={() => { setOpen(false); setPreview(null); }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
