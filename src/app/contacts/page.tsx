import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ContactBook from "@/components/ContactBook";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await requireUser();
  const [customers, suppliers] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { supplier: { select: { id: true } } },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">สมุดรายชื่อ</h1>
        <p className="text-sm text-slate-500">ฐานข้อมูลลูกค้าและผู้จำหน่ายแยกกัน — ใช้กับใบเสนอราคาและจัดซื้อ</p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-400">กำลังโหลด…</div>}>
        <ContactBook
          customers={customers}
          suppliers={suppliers}
          canManage={can(user.role, "manageMasterData")}
        />
      </Suspense>
    </div>
  );
}
