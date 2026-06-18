"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { num } from "@/lib/format";

export interface QtyOption {
  qty: number;
  total: number | null;
}

export default function QuotationActions({
  quotationId,
  status,
  quantities,
  existingJob,
  canManage,
}: {
  quotationId: number;
  status: string;
  quantities: QtyOption[];
  existingJob: { id: number; code: string } | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState<number>(quantities[0]?.qty ?? 0);
  const [error, setError] = useState("");

  if (existingJob) {
    return (
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Link href={`/jobs/${existingJob.id}`} className="btn-outline">
          ดูใบสั่งงาน {existingJob.code}
        </Link>
        <Link href={`/jobs/${existingJob.id}/print`} className="btn-primary">
          พิมพ์ใบสั่งงาน + QR
        </Link>
      </div>
    );
  }

  if (!canManage) return null;

  if (status === "cancelled") {
    return <span className="badge bg-red-50 text-red-600 print:hidden">ยกเลิกงานแล้ว</span>;
  }

  async function accept() {
    setError("");
    if (!chosen) {
      setError("เลือกยอดพิมพ์");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/quotations/${quotationId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: chosen }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/jobs/${data.jobId}`);
    else {
      setError(data.error || "ผิดพลาด");
      setLoading(false);
    }
  }

  async function cancel() {
    if (!confirm("ยืนยันยกเลิกงานนี้?")) return;
    setLoading(true);
    await fetch(`/api/quotations/${quotationId}/cancel`, { method: "POST" });
    router.refresh();
  }

  if (picking) {
    return (
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <select
          className="rounded-lg border border-line px-3 py-2 text-sm"
          value={chosen}
          onChange={(e) => setChosen(Number(e.target.value))}
        >
          {quantities.map((o) => (
            <option key={o.qty} value={o.qty}>
              ยอด {num(o.qty)}
            </option>
          ))}
        </select>
        <button onClick={accept} disabled={loading} className="btn-primary">
          {loading ? "กำลังออก JO…" : "ยืนยันออกใบสั่งงาน"}
        </button>
        <button onClick={() => setPicking(false)} className="btn-ghost">ยกเลิก</button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button onClick={() => setPicking(true)} className="btn-primary">
        ➜ ตกลงรับงาน เลือกยอดพิมพ์
      </button>
      <button onClick={cancel} disabled={loading} className="btn-outline text-red-600">
        ยกเลิกงาน
      </button>
    </div>
  );
}
