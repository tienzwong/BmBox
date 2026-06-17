import { prisma } from "@/lib/prisma";
import QuotationForm from "@/components/QuotationForm";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const user = await requirePermission("createQuotation");
  const [papers, customers, presses] = await Promise.all([
    prisma.paper.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.press.findMany({ where: { active: true }, orderBy: { maxW: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">สร้างใบเสนอราคา</h1>
        <p className="text-sm text-slate-500">
          ระบบจะคำนวณการวางชิ้นงานบนแผ่นกระดาษให้คุ้มที่สุดโดยอัตโนมัติ
        </p>
      </div>
      <QuotationForm
        papers={papers.map((p) => ({
          id: p.id,
          name: p.name,
          grammage: p.grammage,
          sheetW: p.sheetW,
          sheetH: p.sheetH,
          pricePerKg: p.pricePerKg,
          pricePerSheet: p.pricePerSheet,
        }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        presses={presses.map((p) => ({
          id: p.id,
          name: p.name,
          maxW: p.maxW,
          maxH: p.maxH,
          gripper: p.gripper,
          platePerColor: p.platePerColor,
          printPer1000: p.printPer1000,
        }))}
        canViewCost={can(user.role, "viewCost")}
      />
    </div>
  );
}
