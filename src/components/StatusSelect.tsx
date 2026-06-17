"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Opt } from "@/lib/labels";

export default function StatusSelect({
  endpoint,
  id,
  field,
  value,
  options,
}: {
  endpoint: string;
  id: number;
  field: string;
  value: string;
  options: Opt[];
}) {
  const router = useRouter();
  const [val, setVal] = useState(value);
  const [pending, start] = useTransition();
  const current = options.find((o) => o.value === val) ?? options[0];

  async function change(next: string) {
    setVal(next);
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: next }),
    });
    start(() => router.refresh());
  }

  return (
    <select
      value={val}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-black/5 ${current?.cls ?? ""}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
