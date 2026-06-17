"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { num } from "@/lib/format";

export interface InvRow {
  id: number;
  name: string;
  category: string | null;
  unit: string;
  qtyOnHand: number;
  reorderPoint: number;
}

const CAT: Record<string, string> = {
  paper: "กระดาษ",
  ink: "หมึก",
  chemical: "เคมี",
  packaging: "บรรจุภัณฑ์",
  other: "อื่น ๆ",
};

const emptyItem = { name: "", category: "paper", unit: "แผ่น", qtyOnHand: "0", reorderPoint: "0" };

export default function InventoryManager({ items }: { items: InvRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...emptyItem });
  const [saving, setSaving] = useState(false);

  async function addItem() {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "item", ...form }),
    });
    setForm({ ...emptyItem });
    setSaving(false);
    router.refresh();
  }

  async function move(itemId: number, type: "in" | "out") {
    const input = window.prompt(type === "in" ? "รับเข้าจำนวน?" : "เบิกออกจำนวน?");
    if (!input) return;
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", itemId, qty: Number(input), type }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">เพิ่มวัตถุดิบ/สินค้า</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input className="input col-span-2" placeholder="ชื่อ" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className="input" placeholder="หน่วย" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input className="input" type="number" placeholder="ยอดตั้งต้น" value={form.qtyOnHand}
            onChange={(e) => setForm({ ...form, qtyOnHand: e.target.value })} />
        </div>
        <button onClick={addItem} disabled={saving} className="btn-primary mt-3">
          {saving ? "กำลังบันทึก…" : "เพิ่มรายการ"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ชื่อ</th>
              <th className="px-5 py-2.5 font-medium">หมวด</th>
              <th className="px-5 py-2.5 text-right font-medium">คงเหลือ</th>
              <th className="px-5 py-2.5 text-right font-medium">จุดสั่งซื้อ</th>
              <th className="px-5 py-2.5 text-center font-medium">ปรับสต๊อก</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">ยังไม่มีข้อมูล</td></tr>
            ) : items.map((it) => {
              const low = it.qtyOnHand <= it.reorderPoint && it.reorderPoint > 0;
              return (
                <tr key={it.id} className="border-t border-line hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">{it.name}</td>
                  <td className="px-5 py-3 text-slate-500">{it.category ? CAT[it.category] ?? it.category : "-"}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${low ? "text-red-600" : "text-slate-700"}`}>
                    {num(it.qtyOnHand, 0)} {it.unit}{low && " ⚠"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400">{num(it.reorderPoint, 0)}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => move(it.id, "in")} className="mr-1 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700">รับเข้า</button>
                    <button onClick={() => move(it.id, "out")} className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">เบิกออก</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
