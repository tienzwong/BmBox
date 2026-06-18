import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import MachineManager from "@/components/MachineManager";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const user = await requireModule("costing");
  if (!can(user.role, "viewCost")) redirect("/");

  const machines = await prisma.machine.findMany({
    where: { active: true },
    include: { press: { select: { id: true, name: true } } },
    orderBy: [{ machineCode: "asc" }, { id: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/costing" className="text-sm text-brand-600 hover:underline">
            ← บัญชีต้นทุน
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-800">เครื่องจักร & ค่าเสื่อมราคา</h1>
          <p className="text-sm text-slate-500">
            ทะเบียนเครื่องจักร BlessMotive — รหัสเครื่อง, ชื่อ, ขนาด, ประเภท และต้นทุนค่าเสื่อมสำหรับใบเสนอราคา
          </p>
        </div>
      </div>

      <MachineManager
        machines={machines.map((m) => ({
          id: m.id,
          machineCode: m.machineCode,
          name: m.name,
          shortCode: m.shortCode,
          maxSize: m.maxSize,
          minSize: m.minSize,
          typeLabel: m.typeLabel,
          location: m.location,
          department: m.department,
          category: m.category,
          unitLabel: m.unitLabel,
          pressId: m.pressId,
          pressName: m.press?.name ?? null,
          purchasePrice: m.purchasePrice,
          salvageValue: m.salvageValue,
          usefulLifeYears: m.usefulLifeYears,
          workingHoursPerYear: m.workingHoursPerYear,
          hoursPer1000Sheets: m.hoursPer1000Sheets,
          hoursPerPlate: m.hoursPerPlate,
          depreciationPerHour: m.depreciationPerHour,
          depreciationPerMonth: m.depreciationPerMonth,
          depreciationPer1000: m.depreciationPer1000,
          depreciationPerPlate: m.depreciationPerPlate,
          active: m.active,
        }))}
        canManage={can(user.role, "manageMasterData")}
      />
    </div>
  );
}
