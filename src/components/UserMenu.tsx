"use client";

import { useRouter } from "next/navigation";
import { useState, type Ref } from "react";

type UserMenuProps = {
  name: string;
  roleLabel: string;
  department: string | null;
  variant?: "inline" | "sidebar-footer" | "sidebar-flyout";
  onOpenMenu?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};

export default function UserMenu({
  name,
  roleLabel,
  department,
  variant = "inline",
  onOpenMenu,
  buttonRef,
}: UserMenuProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (variant === "sidebar-footer") {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpenMenu}
        className="w-full px-4 pb-3 pt-0 text-left transition hover:opacity-80"
      >
        <div className="truncate text-sm font-semibold text-slate-800">{name}</div>
        <div className="truncate text-[11px] text-slate-400">
          {department ? `${roleLabel} · ${department}` : roleLabel}
        </div>
      </button>
    );
  }

  if (variant === "sidebar-flyout") {
    return (
      <div className="w-56 bg-white p-4">
        <div className="truncate text-sm font-semibold text-slate-800">{name}</div>
        <div className="truncate text-[11px] text-slate-400">
          {department ? `${roleLabel} · ${department}` : roleLabel}
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loading}
          className="mt-3 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          {loading ? "…" : "ออกจากระบบ"}
        </button>
      </div>
    );
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
