import { prisma } from "@/lib/prisma";
import QuotationForm from "@/components/QuotationForm";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const user = await requirePermission("createQuotation");
  const [papers, customers, presses, machines] = await Promise.all([
    prisma.paper.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.press.findMany({ where: { active: true }, orderBy: { maxW: "asc" } }),
    prisma.machine.findMany({
      where: { active: true },
      orderBy: [{ department: "asc" }, { id: "asc" }],
    }),
  ]);

  const pressDepMap = new Map(
    machines.filter((m) => m.department === "printing" && m.pressId).map((m) => [m.pressId!, m.depreciationPer1000])
  );
  const postpressMachines = machines.filter((m) => m.department === "postpress");
  const prepressMachines = machines.filter((m) => m.department === "prepress");

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
          depreciationPer1000: pressDepMap.get(p.id) ?? 0,
        }))}
        postpressMachines={postpressMachines.map((m) => ({
          id: m.id,
          name: m.name,
          unitLabel: m.unitLabel,
          department: m.department,
          category: m.category,
          depreciationPer1000: m.depreciationPer1000,
          depreciationPerPlate: m.depreciationPerPlate,
        }))}
        prepressMachines={prepressMachines.map((m) => ({
          id: m.id,
          name: m.name,
          unitLabel: m.unitLabel,
          department: m.department,
          category: m.category,
          depreciationPer1000: m.depreciationPer1000,
          depreciationPerPlate: m.depreciationPerPlate,
        }))}
        canViewCost={can(user.role, "viewCost")}
      />
    </div>
  );
}
