"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function NumberInline({
  endpoint,
  id,
  field,
  value,
  suffix,
}: {
  endpoint: string;
  id: number;
  field: string;
  value: number;
  suffix?: string;
}) {
  const router = useRouter();
  const [val, setVal] = useState(String(value));
  const [pending, start] = useTransition();

  async function save() {
    if (Number(val) === value) return;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: Number(val) }),
    });
    start(() => router.refresh());
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        value={val}
        disabled={pending}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        className="w-20 rounded-md border border-line px-2 py-1 text-right text-sm"
      />
      {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
    </span>
  );
}
