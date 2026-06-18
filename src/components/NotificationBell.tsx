"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { clampFlyoutTop } from "@/lib/flyout-position";

interface NotifItem {
  id: number;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  jobId: number | null;
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export default function NotificationBell({
  tone = "default",
  panelLeft,
}: {
  tone?: "default" | "rail" | "header";
  panelLeft?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelTop, setPanelTop] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isRail = tone === "rail";
  const isHeader = tone === "header";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotifItem[]; unreadCount: number };
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      // ข้าม
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !popupRef.current) return;
    const anchor = btnRef.current.getBoundingClientRect();
    const panel = popupRef.current.getBoundingClientRect();
    if (isRail) {
      setPanelTop(clampFlyoutTop(anchor, panel.height));
    } else if (isHeader) {
      setPanelTop(anchor.bottom + 4);
    }
  }, [open, isRail, isHeader, items.length]);

  async function markRead(id: number) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setLoading(false);
    await load();
  }

  async function onClickItem(n: NotifItem) {
    if (!n.readAt) await markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  function toggleOpen() {
    setOpen((o) => {
      if (!o) void load();
      return !o;
    });
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className={
          isRail
            ? "relative flex h-11 w-full items-center justify-center text-white transition hover:bg-brand-700/80 hover:text-white"
            : isHeader
              ? "relative flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              : "relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-slate-600 hover:bg-slate-50"
        }
        aria-label="การแจ้งเตือน"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
        {unread > 0 && (
          <span
            className={
              isRail
                ? "absolute right-2.5 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                : isHeader
                  ? "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                  : "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
            }
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popupRef}
          className={
            isRail
              ? "fixed z-50 flex max-h-[calc(100vh-1rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-lg"
              : isHeader
                ? "fixed right-4 z-50 flex max-h-[calc(100vh-1rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-lg"
                : "absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white shadow-lg"
          }
          style={
            isRail && panelLeft
              ? { left: panelLeft, top: panelTop }
              : isHeader
                ? { top: panelTop }
                : undefined
          }
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">การแจ้งเตือน</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-brand-600 hover:underline disabled:opacity-50"
                onClick={() => void markAllRead()}
                disabled={loading}
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-slate-400">ไม่มีการแจ้งเตือน</li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void onClickItem(n)}
                    className={`w-full border-b border-line px-4 py-3 text-left transition hover:bg-slate-50 ${
                      !n.readAt ? "bg-brand-50/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.readAt && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm ${!n.readAt ? "font-medium text-slate-800" : "text-slate-600"}`}>
                          {n.title}
                        </div>
                        {n.body && <div className="mt-0.5 truncate text-xs text-slate-500">{n.body}</div>}
                        <div className="mt-1 text-[10px] text-slate-400">{relTime(n.createdAt)}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
