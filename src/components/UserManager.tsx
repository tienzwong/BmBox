"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABEL, can, type Role } from "@/lib/auth/permissions";

export interface UserRow {
  id: number;
  username: string;
  name: string;
  role: string;
  department: string | null;
  active: boolean;
}

const ROLES = Object.keys(ROLE_LABEL) as Role[];

const empty = { username: "", name: "", role: "sales" as Role, department: "", password: "" };

export default function UserManager({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", department: "", password: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  function openEdit(u: UserRow) {
    setEditing(u);
    setEditForm({ name: u.name, department: u.department ?? "", password: "" });
    setEditError("");
  }

  function closeEdit() {
    setEditing(null);
    setEditForm({ name: "", department: "", password: "" });
    setEditError("");
  }

  async function saveEdit() {
    if (!editing) return;
    setEditError("");
    if (!editForm.name.trim()) {
      setEditError("กรุณาระบุชื่อ-สกุล");
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      setEditError("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setEditSaving(true);
    const body: { name: string; department: string; password?: string } = {
      name: editForm.name.trim(),
      department: editForm.department.trim(),
    };
    if (editForm.password) body.password = editForm.password;

    const res = await fetch(`/api/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditSaving(false);
    if (!res.ok) {
      setEditError((await res.json()).error || "บันทึกไม่สำเร็จ");
      return;
    }
    closeEdit();
    router.refresh();
  }

  async function add() {
    setError("");
    if (!form.username || !form.name || !form.password) {
      setError("กรอกชื่อผู้ใช้ ชื่อ และรหัสผ่าน");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error || "บันทึกไม่สำเร็จ");
      return;
    }
    setForm({ ...empty });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">เพิ่มผู้ใช้งาน</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">ชื่อผู้ใช้ (login)</label>
            <input className="input" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label">ชื่อ-สกุล</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">แผนก/ตำแหน่ง</label>
            <input className="input" value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">บทบาท (สิทธิ์)</label>
            <select className="input" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input type="password" className="input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
        <button onClick={add} disabled={saving} className="btn-primary mt-3">
          {saving ? "กำลังบันทึก…" : "เพิ่มผู้ใช้"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ชื่อผู้ใช้</th>
              <th className="px-5 py-2.5 font-medium">ชื่อ-สกุล</th>
              <th className="px-5 py-2.5 font-medium">แผนก</th>
              <th className="px-5 py-2.5 font-medium">บทบาท</th>
              <th className="px-5 py-2.5 text-center font-medium">เห็นต้นทุน</th>
              <th className="px-5 py-2.5 text-center font-medium">สถานะ</th>
              <th className="px-5 py-2.5 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const seesCost = can(u.role, "viewCost");
              return (
                <tr key={u.id} className="border-t border-line hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">{u.username}</td>
                  <td className="px-5 py-3 text-slate-600">{u.name}</td>
                  <td className="px-5 py-3 text-slate-500">{u.department ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span className="badge bg-brand-50 text-brand-700">{ROLE_LABEL[u.role as Role] ?? u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {seesCost ? (
                      <span className="badge bg-green-50 text-green-700">เห็น</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-500">ไม่เห็น</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {u.active ? (
                      <span className="badge bg-green-50 text-green-700">ใช้งาน</span>
                    ) : (
                      <span className="badge bg-red-50 text-red-600">ปิด</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="btn-ghost text-xs" onClick={() => openEdit(u)}>
                      แก้ไข
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="card w-full max-w-md p-5 shadow-xl" role="dialog" aria-labelledby="edit-user-title">
            <h2 id="edit-user-title" className="text-sm font-semibold text-slate-800">
              แก้ไขผู้ใช้: {editing.username}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              บทบาท: {ROLE_LABEL[editing.role as Role] ?? editing.role} · ชื่อ login แก้ไม่ได้
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">ชื่อ-สกุล</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">แผนก / ตำแหน่ง</label>
                <input
                  className="input"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder="เช่น ฝ่ายขาย, โรงพิมพ์"
                />
              </div>
              <div>
                <label className="label">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  className="input"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="เว้นว่างถ้าไม่เปลี่ยน"
                />
                <p className="mt-1 text-[11px] text-slate-400">อย่างน้อย 8 ตัวอักษร · ว่าง = คงรหัสเดิม</p>
              </div>
            </div>
            {editError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{editError}</div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost text-sm" onClick={closeEdit} disabled={editSaving}>
                ยกเลิก
              </button>
              <button type="button" className="btn-primary text-sm" onClick={saveEdit} disabled={editSaving}>
                {editSaving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
