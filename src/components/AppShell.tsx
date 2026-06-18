"use client";

import { NavIcon, RAIL_ICON_NAMES, type NavIconName } from "@/components/icons/nav-icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

export interface NavLink {
  href: string;
  label: string;
  icon: NavIconName;
  iconClass?: string;
}

export interface NavSection {
  title?: string;
  links: NavLink[];
}

const STORAGE_KEY = "bmbox-sidebar-collapsed";
const RAIL_W = "w-[3.75rem]";

export default function AppShell({
  children,
  sections,
  userName,
  roleLabel,
  department,
}: {
  children: React.ReactNode;
  sections: NavSection[];
  userName: string;
  roleLabel: string;
  department: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, closeMobile]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sectionFromPath = useMemo(() => {
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].links.some((l) => isActive(l.href))) return i;
    }
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, sections]);

  useEffect(() => {
    setActiveSection(sectionFromPath);
  }, [sectionFromPath]);

  function selectSection(index: number) {
    setActiveSection(index);
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const current = sections[activeSection] ?? sections[0];
  const panelTitle = current?.title ?? current?.links[0]?.label ?? "เมนู";

  const mobileSidebar = (
    <>
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          Bm
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold leading-tight">BmBox ERP</div>
          <div className="truncate text-[11px] text-slate-400">เบลสโมทีฟ จำกัด</div>
        </div>
        <button
          type="button"
          onClick={closeMobile}
          className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          aria-label="ปิดเมนู"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  <span className={`flex w-5 shrink-0 justify-center ${link.iconClass ?? "text-brand-500"}`}>
                    <NavIcon name={link.icon} className="h-4 w-4" />
                  </span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop — icon บนแถบน้ำเงิน + ข้อความบนพื้นขาว */}
      <div className="relative hidden shrink-0 md:flex">
        <aside
          className={`flex flex-col border-r border-line transition-[width] duration-200 ease-out ${
            collapsed ? RAIL_W : "w-[15.75rem]"
          }`}
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 border-b border-line">
            <div
              className={`flex ${RAIL_W} shrink-0 items-center justify-center border-r border-white/10 bg-brand-800`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-white">
                Bm
              </div>
            </div>
            {!collapsed && (
              <div className="flex min-w-0 flex-1 items-center justify-between bg-white px-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800">{panelTitle}</div>
                  <div className="truncate text-[11px] text-slate-400">เบลสโมทีฟ จำกัด</div>
                </div>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="ย่อเมนู"
                  title="ย่อเมนู"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Section switchers */}
          <div className="flex shrink-0 border-b border-white/10">
            <div className={`flex ${RAIL_W} shrink-0 flex-col items-center gap-1 bg-brand-800 py-2`}>
              {sections.map((section, i) => {
                const railName = RAIL_ICON_NAMES[i] ?? "layout-dashboard";
                const sectionActive =
                  activeSection === i || section.links.some((l) => isActive(l.href));
                return (
                  <button
                    key={i}
                    type="button"
                    title={section.title ?? section.links[0]?.label}
                    onClick={() => selectSection(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      sectionActive
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <NavIcon name={railName} className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            {!collapsed && (
              <div className="flex flex-1 items-center bg-white px-4 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {panelTitle}
                </span>
              </div>
            )}
          </div>

          {/* Nav links — icon น้ำเงิน | ข้อความขาว */}
          <nav className="flex flex-1 flex-col overflow-y-auto">
            {current?.links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  className="group flex shrink-0"
                >
                  <span
                    className={`flex ${RAIL_W} shrink-0 items-center justify-center py-2.5 transition ${
                      active
                        ? "bg-brand-700 text-white"
                        : "bg-brand-800 text-white/70 group-hover:bg-brand-700/80 group-hover:text-white"
                    }`}
                  >
                    <NavIcon name={link.icon} className="h-5 w-5" />
                  </span>
                  {!collapsed && (
                    <span
                      className={`flex min-w-0 flex-1 items-center truncate px-4 py-2.5 text-sm transition ${
                        active
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "bg-white text-slate-600 group-hover:bg-slate-50 group-hover:text-brand-700"
                      }`}
                    >
                      {link.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="flex shrink-0 border-t border-line">
            <div className={`${RAIL_W} shrink-0 border-r border-white/10 bg-brand-800 py-3 text-center text-[10px] text-white/40`}>
              ERP
            </div>
            {!collapsed && (
              <div className="flex flex-1 items-center bg-white px-4 py-3 text-[11px] text-slate-400">
                โรงพิมพ์แพคเกจจิ้งกระดาษ
              </div>
            )}
          </div>
        </aside>

        {/* ปุ่มขยายเมื่อย่อแล้ว */}
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute top-[3.25rem] left-[3.35rem] z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-50"
            aria-label="ขยายเมนู"
            title="ขยายเมนู"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={closeMobile}
          aria-label="ปิดเมนู"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-line bg-white shadow-xl transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {mobileSidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-600 hover:bg-slate-50 md:hidden"
              aria-label="เปิดเมนู"
              aria-expanded={mobileOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="min-w-0 truncate text-sm font-medium text-slate-500">
              <span className="hidden sm:inline">ระบบจัดการภายใน · </span>BmBox
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu name={userName} roleLabel={roleLabel} department={department} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
