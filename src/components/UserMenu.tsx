"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ name, roleLabel, department }: { name: string; roleLabel: string; department: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <div className="hidden text-right leading-tight sm:block">
        <div className="text-sm font-medium text-slate-700">{name}</div>
        <div className="text-[11px] text-slate-400">{department ? `${roleLabel} · ${department}` : roleLabel}</div>
      </div>
      <div className="truncate text-sm font-medium text-slate-700 sm:hidden">{name.split(" ")[0]}</div>
      <button onClick={logout} disabled={loading} className="btn-outline shrink-0 px-2.5 py-1.5 text-xs sm:px-3">
        {loading ? "…" : (
          <>
            <span className="sm:hidden">ออก</span>
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </>
        )}
      </button>
    </div>
  );
}
