"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { baht, num } from "@/lib/format";
import {
  MACHINE_CATEGORY_LABEL,
  calcDepreciationRates,
  groupMachinesByCatalog,
  machineDisplayName,
  machineUsesPlates,
  type MachineCategory,
} from "@/lib/machine-depreciation";

export interface MachineRow {
  id: number;
  machineCode: string | null;
  name: string;
  shortCode: string | null;
  maxSize: string | null;
  minSize: string | null;
  typeLabel: string | null;
  location: string | null;
  department: string;
  category: string;
  unitLabel: string | null;
  pressId: number | null;
  pressName: string | null;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  workingHoursPerYear: number;
  hoursPer1000Sheets: number;
  hoursPerPlate: number;
  depreciationPerHour: number;
  depreciationPerMonth: number;
  depreciationPer1000: number;
  depreciationPerPlate: number;
  active: boolean;
}

export default function MachineManager({
  machines,
  canManage = false,
}: {
  machines: MachineRow[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MachineRow | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);

  const catalogGroups = groupMachinesByCatalog(machines);

  function openEdit(m: MachineRow) {
    setEditing(m);
    setForm({
      machineCode: m.machineCode ?? "",
      name: m.name,
      shortCode: m.shortCode ?? "",
      maxSize: m.maxSize ?? "",
      minSize: m.minSize ?? "",
      typeLabel: m.typeLabel ?? "",
      location: m.location ?? "บริษัท",
      purchasePrice: m.purchasePrice,
      salvageValue: m.salvageValue,
      usefulLifeYears: m.usefulLifeYears,
      workingHoursPerYear: m.workingHoursPerYear,
      hoursPer1000Sheets: m.hoursPer1000Sheets,
      hoursPerPlate: m.hoursPerPlate,
    });
  }

  const preview = editing
    ? calcDepreciationRates({
        purchasePrice: Number(form.purchasePrice) || 0,
        salvageValue: Number(form.salvageValue) || 0,
        usefulLifeYears: Number(form.usefulLifeYears) || 10,
        workingHoursPerYear: Number(form.workingHoursPerYear) || 2000,
        hoursPer1000Sheets: Number(form.hoursPer1000Sheets) || 0,
        hoursPerPlate: Number(form.hoursPerPlate) || 0,
      })
    : null;

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/machines/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(null);
    router.refresh();
  }

  function perJobLabel(category: string) {
    return machineUsesPlates(category) ? "ค่าเสื่อม/เพลท" : "ค่าเสื่อม/1,000 แผ่น";
  }

  function perJobValue(m: MachineRow) {
    return machineUsesPlates(m.category) ? m.depreciationPerPlate : m.depreciationPer1000;
  }

  const totalMonthly = machines.reduce((s, m) => s + m.depreciationPerMonth, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-slate-400">เครื่องจักรทั้งหมด</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{num(machines.length)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">กลุ่มตามทะเบียน</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{num(catalogGroups.length)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">เครื่องยิงเพลท CTP</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">
            {num(machines.filter((m) => m.category === "plate_maker").length)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">ค่าเสื่อมรวม/เดือน</div>
          <div className="mt-1 text-2xl font-bold text-brand-700">{baht(totalMonthly)}</div>
        </div>
      </div>

      {catalogGroups.map((group) => (
        <div key={group.label} className="card overflow-hidden">
          <div className="border-b border-line bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">{group.label}</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead className="bg-slate-50 text-left text-xs text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">รหัสเครื่อง</th>
                  <th className="px-3 py-2.5 font-medium">ชื่อเครื่อง</th>
                  <th className="px-3 py-2.5 font-medium">รหัส</th>
                  <th className="px-3 py-2.5 font-medium">ขนาดใหญ่สุด</th>
                  <th className="px-3 py-2.5 font-medium">ขนาดเล็กสุด</th>
                  <th className="px-3 py-2.5 font-medium">ประเภท</th>
                  <th className="px-3 py-2.5 font-medium">สถานที่</th>
                  <th className="px-3 py-2.5 text-right font-medium">ราคาทุน</th>
                  <th className="px-3 py-2.5 text-right font-medium">ค่าเสื่อม/เดือน</th>
                  <th className="px-3 py-2.5 text-right font-medium">{perJobLabel(group.rows[0]?.category ?? "")}</th>
                  {canManage && <th className="px-3 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((m) => (
                  <tr key={m.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{m.machineCode ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-800">
                        {machineDisplayName(m.name, m.shortCode, m.unitLabel)}
                      </div>
                      {m.pressName && (
                        <div className="text-[11px] text-slate-400">เชื่อมคลังพิมพ์: {m.pressName}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-slate-600">{m.shortCode ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{m.maxSize ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{m.minSize ?? "—"}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600">
                      {m.typeLabel ?? MACHINE_CATEGORY_LABEL[m.category as MachineCategory] ?? m.category}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-slate-500">{m.location ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{baht(m.purchasePrice)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-brand-700">{baht(m.depreciationPerMonth)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800">{baht(perJobValue(m))}</td>
                    {canManage && (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          แก้ไข
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
            <h3 className="text-sm font-semibold text-slate-800">
              แก้ไขเครื่องจักร — {machineDisplayName(editing.name, editing.shortCode, editing.unitLabel)}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              ข้อมูลทะเบียนตามเอกสาร BlessMotive · ค่าเสื่อมคำนวณจาก (ราคาทุน − มูลค่าซาก) ÷ อายุใช้งาน
            </p>

            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">ทะเบียนเครื่องจักร</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">รหัสเครื่อง</label>
                  <input
                    className="input font-mono text-sm"
                    value={form.machineCode}
                    onChange={(e) => setForm({ ...form, machineCode: e.target.value })}
                    placeholder="MC1018"
                  />
                </div>
                <div>
                  <label className="label">รหัส</label>
                  <input
                    className="input"
                    value={form.shortCode}
                    onChange={(e) => setForm({ ...form, shortCode: e.target.value })}
                    placeholder="MO6 [101]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">ชื่อเครื่อง</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder='Heidelberg M.O. 6 สี [101]'
                  />
                </div>
                <div>
                  <label className="label">ขนาดใหญ่สุด</label>
                  <input
                    className="input"
                    value={form.maxSize}
                    onChange={(e) => setForm({ ...form, maxSize: e.target.value })}
                    placeholder='(19"x25.5")'
                  />
                </div>
                <div>
                  <label className="label">ขนาดเล็กสุด</label>
                  <input
                    className="input"
                    value={form.minSize}
                    onChange={(e) => setForm({ ...form, minSize: e.target.value })}
                    placeholder='(11"x12")'
                  />
                </div>
                <div>
                  <label className="label">ประเภท</label>
                  <input
                    className="input"
                    value={form.typeLabel}
                    onChange={(e) => setForm({ ...form, typeLabel: e.target.value })}
                    placeholder="ตัด 4"
                  />
                </div>
                <div>
                  <label className="label">สถานที่ตั้ง</label>
                  <input
                    className="input"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="บริษัท"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">ต้นทุน & ค่าเสื่อม</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ราคาทุนเครื่อง (บาท)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">มูลค่าซาก (บาท)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.salvageValue}
                    onChange={(e) => setForm({ ...form, salvageValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">อายุใช้งาน (ปี)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.usefulLifeYears}
                    onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">ชั่วโมงทำงาน/ปี</label>
                  <input
                    type="number"
                    className="input"
                    value={form.workingHoursPerYear}
                    onChange={(e) => setForm({ ...form, workingHoursPerYear: e.target.value })}
                  />
                </div>
                {machineUsesPlates(editing.category) ? (
                  <div className="col-span-2">
                    <label className="label">ชั่วโมงทำงานต่อ 1 กรอบเพลท</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.hoursPerPlate}
                      onChange={(e) => setForm({ ...form, hoursPerPlate: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="label">ชั่วโมงทำงานต่อ 1,000 แผ่น</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.hoursPer1000Sheets}
                      onChange={(e) => setForm({ ...form, hoursPer1000Sheets: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {preview && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-medium text-slate-700">ตัวอย่างหลังบันทึก</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>ค่าเสื่อม/เดือน {baht(preview.monthly)}</span>
                  <span>ค่าเสื่อม/ชม. {baht(preview.perHour)}</span>
                  {machineUsesPlates(editing.category) ? (
                    <span>ค่าเสื่อม/เพลท {baht(preview.perPlate)}</span>
                  ) : (
                    <span>ค่าเสื่อม/1,000 แผ่น {baht(preview.per1000)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline text-xs">
                ยกเลิก
              </button>
              <button type="button" onClick={saveEdit} disabled={saving} className="btn-primary text-xs">
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
