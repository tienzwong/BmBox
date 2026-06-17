"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CustomerRow {
  id: number;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  contact: string | null;
}

const empty = { name: "", taxId: "", phone: "", email: "", contact: "", address: "" };

export default function CustomerManager({
  customers,
  canManage = true,
}: {
  customers: CustomerRow[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(empty);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canManage && (
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">เพิ่มลูกค้า</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input className="input" placeholder="ชื่อบริษัท/ลูกค้า"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="เลขผู้เสียภาษี"
            value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          <input className="input" placeholder="ผู้ติดต่อ"
            value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <input className="input" placeholder="โทรศัพท์"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="อีเมล"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="ที่อยู่"
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <button onClick={add} disabled={saving} className="btn-primary mt-3">
          {saving ? "กำลังบันทึก…" : "เพิ่มลูกค้า"}
        </button>
      </div>
      )}

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ชื่อ</th>
              <th className="px-5 py-2.5 font-medium">เลขผู้เสียภาษี</th>
              <th className="px-5 py-2.5 font-medium">ผู้ติดต่อ</th>
              <th className="px-5 py-2.5 font-medium">โทรศัพท์</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีข้อมูล</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-700">{c.name}</td>
                <td className="px-5 py-3 text-slate-500">{c.taxId ?? "-"}</td>
                <td className="px-5 py-3 text-slate-500">{c.contact ?? "-"}</td>
                <td className="px-5 py-3 text-slate-500">{c.phone ?? "-"}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
