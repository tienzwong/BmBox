"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CopyButton({ quotationId, isPattern }: { quotationId: number; isPattern: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function copy() {
    setLoading(true);
    const res = await fetch(`/api/quotations/${quotationId}/copy`, { method: "POST" });
    const data = await res.json();
    if (res.ok) router.push(`/quotations/${data.id}`);
    else setLoading(false);
  }

  return (
    <button onClick={copy} disabled={loading} className="btn-outline print:hidden">
      {loading ? "กำลังคัดลอก…" : isPattern ? "สร้างงานจากแม่แบบ" : "คัดลอกงาน"}
    </button>
  );
}
