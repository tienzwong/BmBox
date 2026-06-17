"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { num, baht } from "@/lib/format";
import { sheetWeightKg, pricePerSheetFromKg } from "@/lib/imposition";

export interface PaperRow {
  id: number;
  name: string;
  grammage: number;
  sheetW: number;
  sheetH: number;
  pricePerKg: number | null;
  pricePerSheet: number | null;
}

const empty = { name: "", grammage: 350, sheetW: 65, sheetH: 91, pricePerKg: 38, pricePerSheet: "" };

export default function PaperManager({
  papers,
  canViewCost = true,
  canManage = true,
}: {
  papers: PaperRow[];
  canViewCost?: boolean;
  canManage?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string | number>>(empty);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(empty);
    setSaving(false);
    router.refresh();
  }

  function effectivePrice(p: PaperRow) {
    if (p.pricePerSheet != null) return p.pricePerSheet;
    if (p.pricePerKg != null) return pricePerSheetFromKg(p.sheetW, p.sheetH, p.grammage, p.pricePerKg);
    return 0;
  }

  return (
    <div className="space-y-6">
      {canManage && (
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">เพิ่มชนิดกระดาษ</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="col-span-2">
            <label className="label">ชื่อกระดาษ</label>
            <input className="input" placeholder="อาร์ตการ์ด 350 แกรม"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">แกรม</label>
            <input type="number" className="input" value={form.grammage}
              onChange={(e) => setForm({ ...form, grammage: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">กว้าง (ซม.)</label>
            <input type="number" step="0.1" className="input" value={form.sheetW}
              onChange={(e) => setForm({ ...form, sheetW: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">ยาว (ซม.)</label>
            <input type="number" step="0.1" className="input" value={form.sheetH}
              onChange={(e) => setForm({ ...form, sheetH: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">ราคา/กก.</label>
            <input type="number" step="0.1" className="input" value={form.pricePerKg}
              onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={add} disabled={saving} className="btn-primary">
            {saving ? "กำลังบันทึก…" : "เพิ่มกระดาษ"}
          </button>
          <span className="text-xs text-slate-400">
            * กรอกราคาต่อกิโล ระบบจะคำนวณราคาต่อแผ่นจากน้ำหนักให้อัตโนมัติ
          </span>
        </div>
      </div>
      )}

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ชื่อ</th>
              <th className="px-5 py-2.5 text-center font-medium">แกรม</th>
              <th className="px-5 py-2.5 text-center font-medium">ขนาดแผ่น (ซม.)</th>
              <th className="px-5 py-2.5 text-right font-medium">น้ำหนัก/แผ่น</th>
              {canViewCost && <th className="px-5 py-2.5 text-right font-medium">ราคา/กก.</th>}
              {canViewCost && <th className="px-5 py-2.5 text-right font-medium">ราคา/แผ่น</th>}
            </tr>
          </thead>
          <tbody>
            {papers.length === 0 ? (
              <tr><td colSpan={canViewCost ? 6 : 4} className="p-8 text-center text-slate-400">ยังไม่มีข้อมูล</td></tr>
            ) : papers.map((p) => (
              <tr key={p.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-700">{p.name}</td>
                <td className="px-5 py-3 text-center text-slate-500">{p.grammage}</td>
                <td className="px-5 py-3 text-center text-slate-500">{num(p.sheetW)}×{num(p.sheetH)}</td>
                <td className="px-5 py-3 text-right text-slate-500">{num(sheetWeightKg(p.sheetW, p.sheetH, p.grammage), 3)} กก.</td>
                {canViewCost && <td className="px-5 py-3 text-right text-slate-500">{p.pricePerKg ? baht(p.pricePerKg) : "-"}</td>}
                {canViewCost && <td className="px-5 py-3 text-right font-medium text-brand-700">{baht(effectivePrice(p))}</td>}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
