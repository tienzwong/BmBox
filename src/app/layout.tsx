import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { buildNavItems } from "@/lib/nav";
import AppShell from "@/components/AppShell";

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
  const navItems = user ? buildNavItems(user.role) : [];

  return (
    <html lang="th" className={`${notoThai.variable} h-full`}>
      <body className="min-h-full">
        {!user ? (
          children
        ) : (
          <AppShell
            navItems={navItems}
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
