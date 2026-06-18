import { can, canAccessModule, type Role } from "@/lib/auth/permissions";
import type { NavIconName } from "@/components/icons/nav-icons";
import { MODULES } from "@/modules/registry";

export interface NavLink {
  href: string;
  label: string;
  icon: NavIconName;
  iconClass?: string;
}

export type NavItem =
  | ({ type: "link" } & NavLink)
  | {
      type: "dropdown";
      label: string;
      icon: NavIconName;
      children: NavLink[];
    };

export function buildNavItems(role: Role): NavItem[] {
  const modules = MODULES.filter((m) => canAccessModule(role, m.key));

  const masterData: NavLink[] = [
    { href: "/papers", label: "คลังกระดาษ", icon: "layers", iconClass: "text-slate-400" },
    { href: "/contacts", label: "สมุดรายชื่อ", icon: "book-user", iconClass: "text-slate-400" },
    ...(can(role, "viewCost")
      ? [{ href: "/costing/machines", label: "เครื่องจักร", icon: "cog" as const, iconClass: "text-slate-400" }]
      : []),
    ...(can(role, "manageUsers")
      ? [
          { href: "/users", label: "ผู้ใช้งาน", icon: "users" as const, iconClass: "text-slate-400" },
          { href: "/settings/backup", label: "สำรองข้อมูล", icon: "database-backup" as const, iconClass: "text-slate-400" },
        ]
      : []),
    ...(can(role, "manageMasterData") || can(role, "manageUsers")
      ? [{ href: "/settings/architecture", label: "โครงสร้างระบบ", icon: "network" as const, iconClass: "text-slate-400" }]
      : []),
  ];

  return [
    { type: "link", href: "/", label: "ภาพรวม", icon: "layout-dashboard" },
    ...modules.map((m) => ({
      type: "link" as const,
      href: m.path,
      label: m.name,
      icon: m.icon,
      iconClass: m.accent,
    })),
    {
      type: "dropdown",
      label: "ข้อมูลหลัก",
      icon: "database",
      children: masterData,
    },
  ];
}
