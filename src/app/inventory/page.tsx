import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import InventoryManager from "@/components/InventoryManager";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requireModule("inventory");
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">คลังสินค้า</h1>
        <p className="text-sm text-slate-500">วัตถุดิบและสต๊อกคงเหลือ</p>
      </div>
      <InventoryManager items={items} />
    </div>
  );
}
