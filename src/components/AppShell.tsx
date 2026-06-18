"use client";

import BmLogo from "@/components/BmLogo";
import { NavIcon } from "@/components/icons/nav-icons";
import type { NavItem, NavLink } from "@/lib/nav";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import { resolvePageTitle } from "@/lib/page-title";

const STORAGE_KEY = "bmbox-sidebar-collapsed";
const RAIL_W = "w-[3.75rem]";
const ROW_H = "h-11";
const NAV_ROW_MAX = 44;
const HEADER_PX = 64; // h-16
const FOOTER_PX = 88; // กระดิ่ง + แถวผู้ใช้ (h-11 × 2)
const HEADER_H = "h-16";
const LOGO_H = "h-[2.625rem]"; // +50% จาก h-7
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
  const userFooterRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navRowPx, setNavRowPx] = useState(NAV_ROW_MAX);

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

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const update = () => {
      const n = Math.max(navItems.length, 1);
      // วัดจาก nav โดยตรง; fallback จาก viewport เมื่อยังไม่มี layout
      let h = nav.clientHeight;
      if (h < 1 && typeof window !== "undefined") {
        h = Math.max(0, window.innerHeight - HEADER_PX - FOOTER_PX);
      }
      setNavRowPx(Math.min(NAV_ROW_MAX, h / n));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [navItems.length, collapsed]);

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

  function openUserFlyout(anchor: HTMLElement) {
    closeMasterFlyout();
    setUserFlyoutTop(anchor.getBoundingClientRect().top);
    setUserOpen(true);
  }

  function toggleUserFlyoutFromIcon() {
    if (userOpen) {
      closeUserFlyout();
      return;
    }
    if (userBtnRef.current) openUserFlyout(userBtnRef.current);
  }

  function toggleUserFlyoutFromFooter() {
    if (userOpen) {
      closeUserFlyout();
      return;
    }
    if (userFooterRef.current) openUserFlyout(userFooterRef.current);
  }

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const mobileTitle = resolvePageTitle(pathname, navItems);

  const navRowStyle = {
    height: navRowPx,
    maxHeight: NAV_ROW_MAX,
    flexShrink: 1,
  };
  const iconSize = navRowPx < 26 ? "h-3.5 w-3.5" : navRowPx < 34 ? "h-4 w-4" : "h-5 w-5";
  const navGridStyle = {
    gridTemplateRows: `repeat(${navItems.length}, ${navRowPx}px)`,
  };

  function iconBtnClass(active: boolean) {
    return `flex w-full shrink-0 items-center justify-center transition ${
      active
        ? "bg-brand-700 text-white"
        : "text-white/70 hover:bg-brand-700/80 hover:text-white"
    }`;
  }

  function labelLinkClass(active: boolean) {
    return `flex w-full shrink-0 items-center truncate px-4 text-sm transition ${
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
        <BmLogo className={`${LOGO_H} w-auto shrink-0 text-brand-600`} />
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
        <div className="mt-3">
          <UserMenu name={userName} roleLabel={roleLabel} department={department} variant="sidebar-flyout" />
        </div>
      </div>
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
          className="fixed inset-y-0 left-0 z-40 flex h-screen flex-col"
          style={{ width: sidebarWidth, transition: "width 200ms ease-out" }}
        >
          {/* แถบน้ำเงินเต็มความสูง */}
          <div className={`absolute inset-y-0 left-0 ${RAIL_W} bg-brand-800`} aria-hidden />

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <div className={`relative flex ${RAIL_W} shrink-0 flex-col text-white`}>
              <div
                className={`flex ${HEADER_H} shrink-0 items-center justify-center border-b border-white/10 px-1`}
              >
                <BmLogo className={`${LOGO_H} w-auto max-w-[3.25rem] text-white`} />
              </div>

              <nav
                ref={navRef}
                className="grid min-h-0 flex-1 overflow-hidden"
                style={navGridStyle}
              >
                {navItems.map((item) => {
                  if (item.type === "link") {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={iconBtnClass(active)}
                        style={navRowStyle}
                      >
                        <NavIcon name={item.icon} className={iconSize} />
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
                      style={navRowStyle}
                    >
                      <NavIcon name={item.icon} className={iconSize} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {!collapsed && (
              <div className="relative flex w-48 shrink-0 flex-col border-r border-line bg-white">
                <div
                  className={`flex ${HEADER_H} shrink-0 items-center justify-between border-b border-line px-4`}
                >
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

                <nav className="grid min-h-0 flex-1 overflow-hidden" style={navGridStyle}>
                  {navItems.map((item) => {
                    if (item.type === "link") {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${labelLinkClass(isActive(item.href))} ${navRowPx < 34 ? "text-xs" : "text-sm"}`}
                          style={navRowStyle}
                        >
                          {item.label}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key="master-data-label"
                        type="button"
                        onClick={toggleMasterFlyout}
                        className={`${labelLinkClass(masterChildActive || masterOpen)} justify-between gap-2 ${navRowPx < 34 ? "text-xs" : "text-sm"}`}
                        style={navRowStyle}
                      >
                        <span className="truncate">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* Footer — ความสูงคงที่ */}
          <div className="relative flex shrink-0">
            <div className={`relative ${RAIL_W} shrink-0`}>
              <NotificationBell tone="rail" panelLeft={sidebarWidth} />
            </div>
            {!collapsed && <div className={`${ROW_H} w-48 shrink-0 bg-white`} aria-hidden />}
          </div>
          <div className="relative flex shrink-0">
            <div className={`relative ${RAIL_W} shrink-0 flex ${ROW_H} items-center justify-center`}>
              <button
                ref={userBtnRef}
                type="button"
                title={userName}
                onClick={toggleUserFlyoutFromIcon}
                className="flex h-full w-full items-center justify-center text-white transition hover:opacity-80"
                aria-label="บัญชีผู้ใช้"
                aria-expanded={userOpen}
              >
                <User className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {!collapsed && (
              <div className={`flex w-48 shrink-0 items-center bg-white ${ROW_H}`}>
                <UserMenu
                  name={userName}
                  roleLabel={roleLabel}
                  department={department}
                  variant="sidebar-footer"
                  buttonRef={userFooterRef}
                  onOpenMenu={toggleUserFlyoutFromFooter}
                  compact
                />
              </div>
            )}
          </div>
        </aside>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="fixed top-16 z-50 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-50"
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

      {/* Floating menu — บัญชีผู้ใช้ */}
      {userOpen && (
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
        <header className="sticky top-0 z-30 bg-brand-600 md:hidden">
          <div className="grid h-14 grid-cols-[3rem_1fr_3rem] items-center px-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              aria-label="เปิดเมนู"
              aria-expanded={mobileOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className="truncate text-center text-base font-semibold text-white">{mobileTitle}</h1>
            <div className="flex justify-end">
              <NotificationBell tone="header" />
            </div>
          </div>
        </header>
        <main className="px-4 pb-4 pt-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
