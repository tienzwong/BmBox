"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Proc {
  name: string;
  done: boolean;
}

export default function ProcessChecklist({
  endpoint,
  id,
  value,
}: {
  endpoint: string;
  id: number;
  value: string; // JSON string
}) {
  const router = useRouter();
  const [procs, setProcs] = useState<Proc[]>(() => {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  });
  const [, start] = useTransition();

  async function toggle(i: number) {
    const next = procs.map((p, idx) => (idx === i ? { ...p, done: !p.done } : p));
    setProcs(next);
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, processes: next }),
    });
    start(() => router.refresh());
  }

  if (procs.length === 0) return <span className="text-xs text-slate-400">-</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {procs.map((p, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-black/5 ${
            p.done ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {p.done ? "✓ " : ""}
          {p.name}
        </button>
      ))}
    </div>
  );
}
