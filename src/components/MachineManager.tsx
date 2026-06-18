"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { baht, num } from "@/lib/format";
import {
  MACHINE_CATEGORY_LABEL,
  MACHINE_DEPARTMENT_LABEL,
  calcDepreciationRates,
  machineDisplayName,
  machineUsesPlates,
  type MachineCategory,
  type MachineDepartment,
} from "@/lib/machine-depreciation";

export interface MachineRow {
  id: number;
  name: string;
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

function groupByDepartment(machines: MachineRow[]) {
  const prepress = machines.filter((m) => m.department === "prepress");
  const printing = machines.filter((m) => m.department === "printing");
  const postpress = machines.filter((m) => m.department === "postpress");
  return { prepress, printing, postpress };
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

  const groups = groupByDepartment(machines);

  function openEdit(m: MachineRow) {
    setEditing(m);
    setForm({
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

  function MachineTable({
    rows,
    dept,
    perJobLabel,
    perJobValue,
  }: {
    rows: MachineRow[];
    dept: MachineDepartment;
    perJobLabel: string;
    perJobValue: (m: MachineRow) => number;
  }) {
    if (rows.length === 0) return null;
    return (
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{MACHINE_DEPARTMENT_LABEL[dept]}</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">เครื่องจักร</th>
                <th className="px-5 py-2.5 font-medium">ประเภท</th>
                <th className="px-5 py-2.5 text-right font-medium">ราคาทุน</th>
                <th className="px-5 py-2.5 text-right font-medium">ค่าเสื่อม/เดือน</th>
                <th className="px-5 py-2.5 text-right font-medium">ค่าเสื่อม/ชม.</th>
                <th className="px-5 py-2.5 text-right font-medium">{perJobLabel}</th>
                {canManage && <th className="px-5 py-2.5 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-line hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{machineDisplayName(m.name, m.unitLabel)}</div>
                    {m.pressName && <div className="text-xs text-slate-400">เชื่อมเครื่องพิมพ์: {m.pressName}</div>}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {MACHINE_CATEGORY_LABEL[m.category as MachineCategory] ?? m.category}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">{baht(m.purchasePrice)}</td>
                  <td className="px-5 py-3 text-right font-medium text-brand-700">{baht(m.depreciationPerMonth)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{baht(m.depreciationPerHour)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-800">{baht(perJobValue(m))}</td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => openEdit(m)} className="text-xs text-brand-600 hover:underline">
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
    );
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
          <div className="text-xs text-slate-400">พรีเพลส</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{num(groups.prepress.length)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">พิมพ์ + หลังพิมพ์</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{num(groups.printing.length + groups.postpress.length)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-400">ค่าเสื่อมรวม/เดือน</div>
          <div className="mt-1 text-2xl font-bold text-brand-700">{baht(totalMonthly)}</div>
        </div>
      </div>

      <MachineTable
        rows={groups.prepress}
        dept="prepress"
        perJobLabel="ค่าเสื่อม/เพลท"
        perJobValue={(m) => m.depreciationPerPlate}
      />
      <MachineTable
        rows={groups.printing}
        dept="printing"
        perJobLabel="ค่าเสื่อม/1,000 แผ่น"
        perJobValue={(m) => m.depreciationPer1000}
      />
      <MachineTable
        rows={groups.postpress}
        dept="postpress"
        perJobLabel="ค่าเสื่อม/1,000 แผ่น"
        perJobValue={(m) => m.depreciationPer1000}
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
            <h3 className="mb-1 text-sm font-semibold text-slate-800">
              แก้ไขค่าเสื่อม — {machineDisplayName(editing.name, editing.unitLabel)}
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              ระบบคำนวณค่าเสื่อมจาก (ราคาทุน − มูลค่าซาก) ÷ อายุใช้งาน แล้วแปลงเป็นต้นทุนต่อชั่วโมง
              {editing && machineUsesPlates(editing.category)
                ? " และต่อกรอบเพลท"
                : " และต่อ 1,000 แผ่น"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">ราคาทุนเครื่อง (บาท)</label>
                <input
                  type="number"
                  className="input"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
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
              {editing && machineUsesPlates(editing.category) ? (
                <div className="col-span-2">
                  <label className="label">ชั่วโมงทำงานต่อ 1 กรอบเพลท</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.hoursPerPlate}
                    onChange={(e) => setForm({ ...form, hoursPerPlate: e.target.value })}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">ใช้คำนวณต้นทุนค่าเสื่อมจากจำนวนกรอบเพลทที่ต้องทำ</p>
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
                  <p className="mt-1 text-[11px] text-slate-400">ใช้คำนวณต้นทุนค่าเสื่อมต่องานจากจำนวนแผ่นพิมพ์</p>
                </div>
              )}
            </div>
            {preview && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-medium text-slate-700">ตัวอย่างหลังบันทึก</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>ค่าเสื่อม/เดือน {baht(preview.monthly)}</span>
                  <span>ค่าเสื่อม/ชม. {baht(preview.perHour)}</span>
                  {editing && machineUsesPlates(editing.category) ? (
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
