"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { baht, num, thaiDate } from "@/lib/format";
import { PO_STATUS } from "@/lib/labels";
import StatusSelect from "@/components/StatusSelect";

export interface SupplierRow {
  id: number;
  name: string;
  phone: string | null;
  contact: string | null;
}
export interface POItemRow {
  description: string;
  qty: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
}
export interface PORow {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string | Date;
  supplier: { name: string };
  items: POItemRow[];
}

interface Line {
  description: string;
  qty: string;
  unit: string;
  unitPrice: string;
}

const PO_OPTS = Object.values(PO_STATUS);

export default function PurchasingManager({
  suppliers,
  orders,
}: {
  suppliers: SupplierRow[];
  orders: PORow[];
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<number | "">(suppliers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", qty: "1", unit: "", unitPrice: "0" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newSupplier, setNewSupplier] = useState("");

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  const total = lines.reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice), 0);

  async function addSupplier() {
    if (!newSupplier.trim()) return;
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSupplier.trim() }),
    });
    setNewSupplier("");
    router.refresh();
  }

  async function createPO() {
    setError("");
    if (!supplierId) {
      setError("เลือกผู้ขาย");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/purchasing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        note,
        items: lines
          .filter((l) => l.description)
          .map((l) => ({ description: l.description, qty: Number(l.qty), unit: l.unit, unitPrice: Number(l.unitPrice) })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error || "บันทึกไม่สำเร็จ");
      return;
    }
    setLines([{ description: "", qty: "1", unit: "", unitPrice: "0" }]);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">สร้างใบสั่งซื้อ (PO)</h2>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">ผู้ขาย</label>
              <select className="input" value={String(supplierId)}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">— เลือกผู้ขาย —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className="input col-span-5" placeholder="รายการ" value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })} />
                <input className="input col-span-2" type="number" placeholder="จำนวน" value={l.qty}
                  onChange={(e) => setLine(i, { qty: e.target.value })} />
                <input className="input col-span-2" placeholder="หน่วย" value={l.unit}
                  onChange={(e) => setLine(i, { unit: e.target.value })} />
                <input className="input col-span-3" type="number" placeholder="ราคา/หน่วย" value={l.unitPrice}
                  onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
              </div>
            ))}
          </div>
          <button className="mt-2 text-xs text-brand-600 hover:underline"
            onClick={() => setLines((p) => [...p, { description: "", qty: "1", unit: "", unitPrice: "0" }])}>
            ＋ เพิ่มรายการ
          </button>

          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">รวม <b className="text-slate-800">{baht(total)}</b></span>
            <button onClick={createPO} disabled={saving} className="btn-primary">
              {saving ? "กำลังบันทึก…" : "บันทึก PO"}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">ผู้ขาย ({suppliers.length})</h2>
          <div className="mb-3 flex gap-2">
            <input className="input" placeholder="ชื่อผู้ขายใหม่" value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)} />
            <button onClick={addSupplier} className="btn-outline whitespace-nowrap">เพิ่ม</button>
          </div>
          <ul className="space-y-1 text-sm text-slate-600">
            {suppliers.map((s) => <li key={s.id} className="border-t border-line py-1.5">{s.name}</li>)}
          </ul>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold text-slate-700">ใบสั่งซื้อล่าสุด</div>
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">เลขที่</th>
              <th className="px-5 py-2.5 font-medium">ผู้ขาย</th>
              <th className="px-5 py-2.5 text-center font-medium">รายการ</th>
              <th className="px-5 py-2.5 text-right font-medium">ยอดรวม</th>
              <th className="px-5 py-2.5 font-medium">สถานะ</th>
              <th className="px-5 py-2.5 font-medium">วันที่</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">ยังไม่มีใบสั่งซื้อ</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-700">{o.number}</td>
                <td className="px-5 py-3 text-slate-600">{o.supplier.name}</td>
                <td className="px-5 py-3 text-center text-slate-500">{num(o.items.length)}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">{baht(o.total)}</td>
                <td className="px-5 py-3">
                  <StatusSelect endpoint="/api/purchasing" id={o.id} field="status" value={o.status} options={PO_OPTS} />
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">{thaiDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
