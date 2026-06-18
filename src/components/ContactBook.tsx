"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CONTACT_FILTERS,
  CONTACT_KIND_BADGE,
  CONTACT_KIND_DOT,
  CONTACT_KIND_LABEL,
  buildContactRows,
  filterContacts,
  type ContactFilter,
  type ContactKind,
  type ContactRow,
} from "@/lib/contacts";

const empty = { name: "", taxId: "", phone: "", email: "", contact: "", address: "" };

export default function ContactBook({
  customers,
  suppliers,
  canManage = false,
}: {
  customers: {
    id: number;
    name: string;
    taxId: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    supplier: { id: number } | null;
  }[];
  suppliers: {
    id: number;
    name: string;
    taxId: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    customerId: number | null;
  }[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ContactFilter) || "all";
  const [filter, setFilter] = useState<ContactFilter>(
    CONTACT_FILTERS.some((f) => f.value === initialTab) ? initialTab : "all"
  );
  const [form, setForm] = useState(empty);
  const [addKind, setAddKind] = useState<ContactKind>("customer");
  const [saving, setSaving] = useState(false);

  const allRows = useMemo(() => buildContactRows(customers, suppliers), [customers, suppliers]);
  const rows = filterContacts(allRows, filter);

  const counts = useMemo(
    () => ({
      all: allRows.length,
      customer: allRows.filter((r) => r.kind === "customer").length,
      supplier: allRows.filter((r) => r.kind === "supplier").length,
      both: allRows.filter((r) => r.kind === "both").length,
    }),
    [allRows]
  );

  function changeFilter(next: ContactFilter) {
    setFilter(next);
    const q = next === "all" ? "" : `?tab=${next}`;
    router.replace(`/contacts${q}`, { scroll: false });
  }

  async function addContact() {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      taxId: form.taxId || null,
      phone: form.phone || null,
      email: form.email || null,
      contact: form.contact || null,
      address: form.address || null,
    };

    if (addKind === "both") {
      await fetch("/api/contacts/both", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else if (addKind === "supplier") {
      await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setForm(empty);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs — REF style */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
        {CONTACT_FILTERS.map((f) => {
          const active = filter === f.value;
          const dotKind = f.value === "all" ? null : (f.value as ContactKind);
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => changeFilter(f.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {dotKind && <span className={`h-2 w-2 rounded-full ${CONTACT_KIND_DOT[dotKind]}`} />}
              {f.label}
              <span className={`text-xs ${active ? "text-brand-500" : "text-slate-400"}`}>
                ({counts[f.value]})
              </span>
            </button>
          );
        })}
      </div>

      {canManage && (
        <div className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">เพิ่มรายชื่อ</h2>
            <div className="flex rounded-lg border border-line bg-slate-50 p-0.5">
              {(["customer", "supplier", "both"] as ContactKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAddKind(k)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    addKind === k ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {CONTACT_KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input
              className="input col-span-2 sm:col-span-1"
              placeholder="ชื่อบริษัท / ร้านค้า"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="เลขผู้เสียภาษี"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
            />
            <input
              className="input"
              placeholder="ผู้ติดต่อ"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <input
              className="input"
              placeholder="โทรศัพท์"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="อีเมล"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="ที่อยู่"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <button onClick={addContact} disabled={saving} className="btn-primary mt-3">
            {saving ? "กำลังบันทึก…" : `เพิ่ม${CONTACT_KIND_LABEL[addKind]}`}
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">ประเภท</th>
                <th className="px-5 py-2.5 font-medium">ชื่อ</th>
                <th className="px-5 py-2.5 font-medium">เลขผู้เสียภาษี</th>
                <th className="px-5 py-2.5 font-medium">ผู้ติดต่อ</th>
                <th className="px-5 py-2.5 font-medium">โทรศัพท์</th>
                <th className="px-5 py-2.5 font-medium">อีเมล</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    ยังไม่มีรายชื่อในหมวดนี้
                  </td>
                </tr>
              ) : (
                rows.map((r) => <ContactRow key={r.id} row={r} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ row }: { row: ContactRow }) {
  return (
    <tr className="border-t border-line hover:bg-slate-50">
      <td className="px-5 py-3">
        <span className={`badge inline-flex items-center gap-1.5 ${CONTACT_KIND_BADGE[row.kind]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${CONTACT_KIND_DOT[row.kind]}`} />
          {CONTACT_KIND_LABEL[row.kind]}
        </span>
      </td>
      <td className="px-5 py-3 font-medium text-slate-700">{row.name}</td>
      <td className="px-5 py-3 text-slate-500">{row.taxId ?? "-"}</td>
      <td className="px-5 py-3 text-slate-500">{row.contact ?? "-"}</td>
      <td className="px-5 py-3 text-slate-500">{row.phone ?? "-"}</td>
      <td className="px-5 py-3 text-slate-500">{row.email ?? "-"}</td>
    </tr>
  );
}
