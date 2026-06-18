import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";
import { can, canAccessModule, ROLE_LABEL } from "@/lib/auth/permissions";
import { MODULES } from "@/modules/registry";
import AppShell, { type NavSection } from "@/components/AppShell";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BmBox ERP — เบลสโมทีฟ",
  description: "ระบบ ERP โรงพิมพ์แพคเกจจิ้งกระดาษ — ใบเสนอราคา + คำนวณกระดาษ",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const modules = user ? MODULES.filter((m) => canAccessModule(user.role, m.key)) : [];

  const sections: NavSection[] = user
    ? [
        {
          links: [{ href: "/", label: "ภาพรวม", icon: "layout-dashboard" as const }],
        },
        {
          title: "โมดูลงาน",
          links: modules.map((m) => ({
            href: m.path,
            label: m.name,
            icon: m.icon,
            iconClass: m.accent,
          })),
        },
        {
          title: "ข้อมูลหลัก",
          links: [
            { href: "/papers", label: "คลังกระดาษ", icon: "layers" as const, iconClass: "text-slate-400" },
            { href: "/contacts", label: "สมุดรายชื่อ", icon: "book-user" as const, iconClass: "text-slate-400" },
            ...(can(user.role, "viewCost")
              ? [{ href: "/costing/machines", label: "เครื่องจักร", icon: "cog" as const, iconClass: "text-slate-400" }]
              : []),
            ...(can(user.role, "manageUsers")
              ? [
                  { href: "/users", label: "ผู้ใช้งาน", icon: "users" as const, iconClass: "text-slate-400" },
                  { href: "/settings/backup", label: "สำรองข้อมูล", icon: "database-backup" as const, iconClass: "text-slate-400" },
                ]
              : []),
            ...(can(user.role, "manageMasterData") || can(user.role, "manageUsers")
              ? [{ href: "/settings/architecture", label: "โครงสร้างระบบ", icon: "network" as const, iconClass: "text-slate-400" }]
              : []),
          ],
        },
      ]
    : [];

  return (
    <html lang="th" className={`${notoThai.variable} h-full`}>
      <body className="min-h-full">
        {!user ? (
          children
        ) : (
          <AppShell
            sections={sections}
            userName={user.name}
            roleLabel={ROLE_LABEL[user.role]}
            department={user.department}
          >
            {children}
          </AppShell>
        )}
      </body>
    </html>
  );
}
