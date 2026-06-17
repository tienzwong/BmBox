"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COST_CATEGORY } from "@/lib/labels";

export default function CostEntryForm({ jobId }: { jobId: number }) {
  const router = useRouter();
  const [category, setCategory] = useState("paper");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!amount) return;
    setSaving(true);
    await fetch("/api/costing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, category, amount: Number(amount), note }),
    });
    setAmount("");
    setNote("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(COST_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <input className="input" type="number" placeholder="จำนวนเงิน" value={amount}
        onChange={(e) => setAmount(e.target.value)} />
      <input className="input" placeholder="หมายเหตุ" value={note}
        onChange={(e) => setNote(e.target.value)} />
      <button onClick={add} disabled={saving} className="btn-primary">
        {saving ? "…" : "บันทึกต้นทุน"}
      </button>
    </div>
  );
}
