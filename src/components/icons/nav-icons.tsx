"use client";

import {
  BookUser,
  Calculator,
  Cog,
  Database,
  DatabaseBackup,
  FileText,
  Layers,
  LayoutDashboard,
  Network,
  PenTool,
  Printer,
  Scissors,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export const NAV_ICON_MAP = {
  "layout-dashboard": LayoutDashboard,
  workflow: Workflow,
  database: Database,
  "file-text": FileText,
  "pen-tool": PenTool,
  printer: Printer,
  scissors: Scissors,
  "shopping-cart": ShoppingCart,
  warehouse: Warehouse,
  calculator: Calculator,
  truck: Truck,
  layers: Layers,
  "book-user": BookUser,
  cog: Cog,
  users: Users,
  "database-backup": DatabaseBackup,
  network: Network,
} as const satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICON_MAP;

export function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  const Icon = NAV_ICON_MAP[name] ?? LayoutDashboard;
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}

/** ไอคอน rail ซ้าย — ตามลำดับ section */
export const RAIL_ICON_NAMES: NavIconName[] = ["layout-dashboard", "workflow", "database"];
