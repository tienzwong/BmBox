import type { NavItem } from "@/lib/nav";

const EXTRA_TITLES: [RegExp, string][] = [
  [/^\/quotations\/new$/, "สร้างใบเสนอราคา"],
  [/^\/quotations\/patterns$/, "แม่แบบงานพิมพ์"],
  [/^\/quotations\/packaging-template$/, "Template Packaging"],
  [/^\/quotations\/[^/]+$/, "ใบเสนอราคา"],
  [/^\/jobs\/[^/]+$/, "รายละเอียดงาน"],
  [/^\/costing\/[^/]+$/, "บัญชีต้นทุน"],
];

export function resolvePageTitle(pathname: string, navItems: NavItem[]): string {
  if (pathname === "/") return "ภาพรวม";

  for (const item of navItems) {
    if (item.type === "link") {
      if (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))) {
        return item.label;
      }
    }
    if (item.type === "dropdown") {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(`${child.href}/`)) {
          return child.label;
        }
      }
    }
  }

  for (const [pattern, title] of EXTRA_TITLES) {
    if (pattern.test(pathname)) return title;
  }

  return "BmBox ERP";
}
