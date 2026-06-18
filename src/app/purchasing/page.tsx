import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import PurchasingManager from "@/components/PurchasingManager";

export const dynamic = "force-dynamic";

export default async function PurchasingPage() {
  await requireModule("purchasing");
  const [suppliers, orders] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { supplier: true, items: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">จัดซื้อ</h1>
        <p className="text-sm text-slate-500">ใบสั่งซื้อวัตถุดิบ — จัดการผู้จำหน่ายที่{" "}
          <a href="/contacts?tab=supplier" className="text-brand-600 hover:underline">สมุดรายชื่อ</a>
        </p>
      </div>
      <PurchasingManager
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, phone: s.phone, contact: s.contact }))}
        orders={orders.map((o) => ({
          id: o.id,
          number: o.number,
          status: o.status,
          total: o.total,
          createdAt: o.createdAt,
          supplier: { name: o.supplier.name },
          items: o.items.map((it) => ({
            description: it.description, qty: it.qty, unit: it.unit, unitPrice: it.unitPrice, amount: it.amount,
          })),
        }))}
      />
    </div>
  );
}
