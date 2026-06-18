import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { calcDepreciationRates } from "@/lib/machine-depreciation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "manageMasterData")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const { id } = await params;
    const b = await req.json();

    const existing = await prisma.machine.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: "ไม่พบเครื่องจักร" }, { status: 404 });

    const purchasePrice = b.purchasePrice != null ? Number(b.purchasePrice) : existing.purchasePrice;
    const salvageValue = b.salvageValue != null ? Number(b.salvageValue) : existing.salvageValue;
    const usefulLifeYears = b.usefulLifeYears != null ? Number(b.usefulLifeYears) : existing.usefulLifeYears;
    const workingHoursPerYear =
      b.workingHoursPerYear != null ? Number(b.workingHoursPerYear) : existing.workingHoursPerYear;
    const hoursPer1000Sheets =
      b.hoursPer1000Sheets != null ? Number(b.hoursPer1000Sheets) : existing.hoursPer1000Sheets;
    const hoursPerPlate = b.hoursPerPlate != null ? Number(b.hoursPerPlate) : existing.hoursPerPlate;

    const rates = calcDepreciationRates({
      purchasePrice,
      salvageValue,
      usefulLifeYears,
      workingHoursPerYear,
      hoursPer1000Sheets,
      hoursPerPlate,
    });

    const machine = await prisma.machine.update({
      where: { id: Number(id) },
      data: {
        ...(b.machineCode !== undefined ? { machineCode: b.machineCode || null } : {}),
        ...(b.name != null ? { name: b.name } : {}),
        ...(b.shortCode !== undefined ? { shortCode: b.shortCode || null } : {}),
        ...(b.maxSize !== undefined ? { maxSize: b.maxSize || null } : {}),
        ...(b.minSize !== undefined ? { minSize: b.minSize || null } : {}),
        ...(b.typeLabel !== undefined ? { typeLabel: b.typeLabel || null } : {}),
        ...(b.location !== undefined ? { location: b.location || null } : {}),
        ...(b.unitLabel !== undefined ? { unitLabel: b.unitLabel || null } : {}),
        ...(b.pressId !== undefined ? { pressId: b.pressId ? Number(b.pressId) : null } : {}),
        purchasePrice,
        salvageValue,
        usefulLifeYears,
        workingHoursPerYear,
        hoursPer1000Sheets,
        hoursPerPlate,
        depreciationPerHour: rates.perHour,
        depreciationPerMonth: rates.monthly,
        depreciationPer1000: rates.per1000,
        depreciationPerPlate: rates.perPlate,
        ...(b.active != null ? { active: Boolean(b.active) } : {}),
      },
      include: { press: { select: { id: true, name: true } } },
    });

    return NextResponse.json(machine);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
