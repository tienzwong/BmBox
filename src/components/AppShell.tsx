"use client";

import { NavIcon } from "@/components/icons/nav-icons";
import type { NavItem, NavLink } from "@/lib/nav";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

const STORAGE_KEY = "bmbox-sidebar-collapsed";
const RAIL_W = "w-[3.75rem]";

function NavRow({
  link,
  collapsed,
  active,
  sub = false,
  onNavigate,
}: {
  link: NavLink;
  collapsed: boolean;
  active: boolean;
  sub?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
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
          className={`flex min-w-0 flex-1 items-center truncate py-2.5 text-sm transition ${
            sub ? "pl-6 pr-4" : "px-4"
          } ${
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
}

export default function AppShell({
  children,
  navItems,
  userName,
  roleLabel,
  department,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  department: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);

  const masterDropdown = navItems.find((item) => item.type === "dropdown");
  const masterChildren = masterDropdown?.type === "dropdown" ? masterDropdown.children : [];

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

  const masterChildActive = useMemo(
    () => masterChildren.some((l) => isActive(l.href)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, masterChildren],
  );

  useEffect(() => {
    if (masterChildActive) setMasterOpen(true);
  }, [masterChildActive]);

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

  function renderMobileNav() {
    return navItems.map((item) => {
      if (item.type === "link") {
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobile}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive(item.href)
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            <span className={`flex w-5 shrink-0 justify-center ${item.iconClass ?? "text-brand-500"}`}>
              <NavIcon name={item.icon} className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      }

      return (
        <div key="master-data">
          <button
            type="button"
            onClick={() => setMasterOpen((o) => !o)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              masterChildActive
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            <span className="flex w-5 shrink-0 justify-center text-slate-400">
              <NavIcon name={item.icon} className="h-4 w-4" />
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {masterOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          {masterOpen && (
            <div className="ml-4 space-y-1 border-l border-line pl-2">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(child.href)
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  <span className={`flex w-5 shrink-0 justify-center ${child.iconClass ?? "text-slate-400"}`}>
                    <NavIcon name={child.icon} className="h-4 w-4" />
                  </span>
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    });
  }

  function renderDesktopNav() {
    return navItems.map((item) => {
      if (item.type === "link") {
        return (
          <NavRow
            key={item.href}
            link={item}
            collapsed={collapsed}
            active={isActive(item.href)}
          />
        );
      }

      const open = masterOpen;
      const parentActive = masterChildActive;

      return (
        <div key="master-data">
          <button
            type="button"
            onClick={() => setMasterOpen((o) => !o)}
            title={collapsed ? item.label : undefined}
            className="group flex w-full shrink-0 text-left"
          >
            <span
              className={`flex ${RAIL_W} shrink-0 items-center justify-center py-2.5 transition ${
                parentActive
                  ? "bg-brand-700 text-white"
                  : "bg-brand-800 text-white/70 group-hover:bg-brand-700/80 group-hover:text-white"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
            </span>
            {!collapsed && (
              <span
                className={`flex min-w-0 flex-1 items-center justify-between gap-2 truncate px-4 py-2.5 text-sm transition ${
                  parentActive
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "bg-white text-slate-600 group-hover:bg-slate-50 group-hover:text-brand-700"
                }`}
              >
                <span className="truncate">{item.label}</span>
                {open ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                )}
              </span>
            )}
          </button>
          {open &&
            item.children.map((child) => (
              <NavRow
                key={child.href}
                link={child}
                collapsed={collapsed}
                active={isActive(child.href)}
                sub
              />
            ))}
        </div>
      );
    });
  }

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

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{renderMobileNav()}</nav>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden shrink-0 md:flex">
        <aside
          className={`flex flex-col border-r border-line transition-[width] duration-200 ease-out ${
            collapsed ? RAIL_W : "w-[15.75rem]"
          }`}
        >
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
                  <div className="truncate text-sm font-bold text-slate-800">BmBox ERP</div>
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

          <nav className="flex flex-1 flex-col overflow-y-auto">{renderDesktopNav()}</nav>

          <div className="flex shrink-0 border-t border-line">
            <div
              className={`${RAIL_W} shrink-0 border-r border-white/10 bg-brand-800 py-3 text-center text-[10px] text-white/40`}
            >
              ERP
            </div>
            {!collapsed && (
              <div className="flex flex-1 items-center bg-white px-4 py-3 text-[11px] text-slate-400">
                โรงพิมพ์แพคเกจจิ้งกระดาษ
              </div>
            )}
          </div>
        </aside>

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
