"use client";

import BmLogo from "@/components/BmLogo";
import { NavIcon } from "@/components/icons/nav-icons";
import type { NavItem, NavLink } from "@/lib/nav";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

const STORAGE_KEY = "bmbox-sidebar-collapsed";
const RAIL_W = "w-[3.75rem]";
const ROW_H = "h-11";
const SIDEBAR_EXPANDED = "15.75rem";
const SIDEBAR_COLLAPSED = "3.75rem";

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
  const [userOpen, setUserOpen] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const [userFlyoutTop, setUserFlyoutTop] = useState(0);
  const masterBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);

  const masterDropdown = navItems.find((item) => item.type === "dropdown");
  const masterChildren = masterDropdown?.type === "dropdown" ? masterDropdown.children : [];

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const closeMasterFlyout = useCallback(() => setMasterOpen(false), []);
  const closeUserFlyout = useCallback(() => setUserOpen(false), []);

  useEffect(() => {
    closeMobile();
    closeMasterFlyout();
    closeUserFlyout();
  }, [pathname, closeMobile, closeMasterFlyout, closeUserFlyout]);

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

  useEffect(() => {
    if (!masterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMasterFlyout();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [masterOpen, closeMasterFlyout]);

  useEffect(() => {
    if (!userOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeUserFlyout();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userOpen, closeUserFlyout]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const masterChildActive = useMemo(
    () => masterChildren.some((l) => isActive(l.href)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, masterChildren],
  );

  function toggleCollapsed() {
    closeMasterFlyout();
    closeUserFlyout();
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

  function toggleMasterFlyout() {
    if (masterOpen) {
      closeMasterFlyout();
      return;
    }
    closeUserFlyout();
    if (masterBtnRef.current) {
      setFlyoutTop(masterBtnRef.current.getBoundingClientRect().top);
    }
    setMasterOpen(true);
  }

  function toggleUserFlyout() {
    if (!collapsed) return;
    if (userOpen) {
      closeUserFlyout();
      return;
    }
    closeMasterFlyout();
    if (userBtnRef.current) {
      setUserFlyoutTop(userBtnRef.current.getBoundingClientRect().top);
    }
    setUserOpen(true);
  }

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  function iconBtnClass(active: boolean) {
    return `flex ${ROW_H} w-full shrink-0 items-center justify-center transition ${
      active
        ? "bg-brand-700 text-white"
        : "text-white/70 hover:bg-brand-700/80 hover:text-white"
    }`;
  }

  function labelLinkClass(active: boolean) {
    return `flex ${ROW_H} w-full shrink-0 items-center truncate px-4 text-sm transition ${
      active
        ? "bg-brand-50 font-medium text-brand-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-brand-700"
    }`;
  }

  function renderFlyoutRow(child: NavLink) {
    const active = isActive(child.href);
    return (
      <Link
        key={child.href}
        href={child.href}
        onClick={closeMasterFlyout}
        className="group flex"
      >
        <span
          className={`flex ${RAIL_W} shrink-0 items-center justify-center ${ROW_H} ${
            active ? "bg-brand-700 text-white" : "bg-brand-800 text-white/70 group-hover:bg-brand-700/80 group-hover:text-white"
          }`}
        >
          <NavIcon name={child.icon} className="h-5 w-5" />
        </span>
        <span
          className={`flex w-44 shrink-0 items-center px-4 ${ROW_H} text-sm ${
            active ? "bg-brand-50 font-medium text-brand-700" : "bg-white text-slate-600 group-hover:bg-slate-50"
          }`}
        >
          {child.label}
        </span>
      </Link>
    );
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
            <ChevronRight className="h-4 w-4 text-slate-400" />
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

  const mobileSidebar = (
    <>
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <BmLogo className="h-9 w-auto shrink-0 text-white" />
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
      <div className="shrink-0 border-t border-line p-3">
        <NotificationBell />
      </div>
      <UserMenu name={userName} roleLabel={roleLabel} department={department} variant="sidebar-footer" />
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — fixed เต็มความสูง */}
      <div
        className="relative hidden md:block"
        style={{ width: sidebarWidth, transition: "width 200ms ease-out" }}
      >
        <aside
          className="fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-line"
          style={{ width: sidebarWidth, transition: "width 200ms ease-out" }}
        >
          {/* Header */}
          <div className="flex shrink-0">
            <div
              className={`flex ${RAIL_W} h-14 shrink-0 items-center justify-center border-b border-white/10 bg-brand-800`}
            >
              <BmLogo className="h-7 w-auto text-white" />
            </div>
            {!collapsed && (
              <div className="flex h-14 w-48 shrink-0 items-center justify-between border-b border-line bg-white px-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800">BmBox ERP</div>
                  <div className="truncate text-[11px] text-slate-400">เบลสโมทีฟ จำกัด</div>
                </div>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="ย่อเมนู"
                  title="ย่อเมนู"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="flex min-h-0 flex-1">
            <div className={`${RAIL_W} flex min-h-0 flex-1 flex-col overflow-y-auto bg-brand-800`}>
              {navItems.map((item) => {
                if (item.type === "link") {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={iconBtnClass(active)}
                    >
                      <NavIcon name={item.icon} className="h-5 w-5" />
                    </Link>
                  );
                }

                return (
                  <button
                    key="master-data"
                    ref={masterBtnRef}
                    type="button"
                    title={collapsed ? item.label : undefined}
                    onClick={toggleMasterFlyout}
                    className={iconBtnClass(masterChildActive || masterOpen)}
                  >
                    <NavIcon name={item.icon} className="h-5 w-5" />
                  </button>
                );
              })}
            </div>

            {!collapsed && (
              <div className="flex w-48 min-h-0 flex-1 flex-col overflow-y-auto bg-white">
                {navItems.map((item) => {
                  if (item.type === "link") {
                    return (
                      <Link key={item.href} href={item.href} className={labelLinkClass(isActive(item.href))}>
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key="master-data-label"
                      type="button"
                      onClick={toggleMasterFlyout}
                      className={`${labelLinkClass(masterChildActive || masterOpen)} justify-between gap-2`}
                    >
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer — แจ้งเตือน + บัญชีผู้ใช้ */}
          <div className="flex shrink-0 border-t border-line">
            <div className={`${RAIL_W} shrink-0 bg-brand-800`}>
              <NotificationBell tone="rail" panelLeft={sidebarWidth} />
              <button
                ref={userBtnRef}
                type="button"
                title={collapsed ? userName : undefined}
                onClick={collapsed ? toggleUserFlyout : undefined}
                className={`flex ${ROW_H} w-full items-center justify-center transition ${
                  userOpen
                    ? "bg-brand-700 text-white"
                    : "text-white/70 hover:bg-brand-700/80 hover:text-white"
                }`}
                aria-label="บัญชีผู้ใช้"
              >
                <User className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {!collapsed && (
              <div className="flex w-48 shrink-0 flex-col bg-white">
                <div className={`${ROW_H} shrink-0`} aria-hidden />
                <UserMenu
                  name={userName}
                  roleLabel={roleLabel}
                  department={department}
                  variant="sidebar-footer"
                />
              </div>
            )}
          </div>
        </aside>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="fixed top-[3.25rem] z-50 flex h-7 w-7 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-50"
            style={{ left: "calc(3.75rem - 0.875rem)" }}
            aria-label="ขยายเมนู"
            title="ขยายเมนู"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Floating menu — ข้อมูลหลัก */}
      {masterOpen && masterDropdown?.type === "dropdown" && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 hidden md:block"
            onClick={closeMasterFlyout}
            aria-label="ปิดเมนูข้อมูลหลัก"
          />
          <div
            className="fixed z-50 hidden overflow-hidden rounded-lg border border-line bg-white shadow-xl md:block"
            style={{ left: sidebarWidth, top: flyoutTop }}
          >
            {masterDropdown.children.map((child) => renderFlyoutRow(child))}
          </div>
        </>
      )}

      {/* Floating menu — บัญชีผู้ใช้ (เมื่อย่อ sidebar) */}
      {userOpen && collapsed && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 hidden md:block"
            onClick={closeUserFlyout}
            aria-label="ปิดเมนูผู้ใช้"
          />
          <div
            className="fixed z-50 hidden overflow-hidden rounded-lg border border-line bg-white shadow-xl md:block"
            style={{ left: sidebarWidth, top: userFlyoutTop }}
          >
            <UserMenu
              name={userName}
              roleLabel={roleLabel}
              department={department}
              variant="sidebar-flyout"
            />
          </div>
        </>
      )}

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

      {/* เนื้อหาหลัก */}
      <div
        className={`min-h-screen min-w-0 transition-[margin] duration-200 ease-out ${
          collapsed ? "md:ml-[3.75rem]" : "md:ml-[15.75rem]"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-slate-600 shadow-sm hover:bg-slate-50 md:hidden"
          aria-label="เปิดเมนู"
          aria-expanded={mobileOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
