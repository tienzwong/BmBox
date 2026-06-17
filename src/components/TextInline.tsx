"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function TextInline({
  endpoint,
  id,
  field,
  value,
  placeholder,
}: {
  endpoint: string;
  id: number;
  field: string;
  value: string | null;
  placeholder?: string;
}) {
  const router = useRouter();
  const [val, setVal] = useState(value ?? "");
  const [pending, start] = useTransition();

  async function save() {
    if ((value ?? "") === val) return;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: val }),
    });
    start(() => router.refresh());
  }

  return (
    <input
      value={val}
      disabled={pending}
      placeholder={placeholder}
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      className="w-32 rounded-md border border-line px-2 py-1 text-sm"
    />
  );
}
