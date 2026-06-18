import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { calcDepreciationRates } from "@/lib/machine-depreciation";

function toPayload(m: {
  id: number;
  name: string;
  department: string;
  category: string;
  unitLabel: string | null;
  pressId: number | null;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  workingHoursPerYear: number;
  hoursPer1000Sheets: number;
  hoursPerPlate: number;
  depreciationPerHour: number;
  depreciationPerMonth: number;
  depreciationPer1000: number;
  depreciationPerPlate: number;
  active: boolean;
  press?: { id: number; name: string } | null;
}) {
  return {
    id: m.id,
    name: m.name,
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
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "viewCost")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const machines = await prisma.machine.findMany({
    where: { active: true },
    include: { press: { select: { id: true, name: true } } },
    orderBy: [{ department: "asc" }, { category: "asc" }, { id: "asc" }],
  });
  return NextResponse.json(machines.map(toPayload));
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "manageMasterData")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const b = await req.json();
    if (!b.name || !b.department || !b.category) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }
    const rates = calcDepreciationRates({
      purchasePrice: Number(b.purchasePrice) || 0,
      salvageValue: Number(b.salvageValue) || 0,
      usefulLifeYears: Number(b.usefulLifeYears) || 10,
      workingHoursPerYear: Number(b.workingHoursPerYear) || 2000,
      hoursPer1000Sheets: Number(b.hoursPer1000Sheets) || 0,
      hoursPerPlate: Number(b.hoursPerPlate) || 0,
    });
    const machine = await prisma.machine.create({
      data: {
        name: b.name,
        department: b.department,
        category: b.category,
        unitLabel: b.unitLabel || null,
        pressId: b.pressId ? Number(b.pressId) : null,
        purchasePrice: Number(b.purchasePrice) || 0,
        salvageValue: Number(b.salvageValue) || 0,
        usefulLifeYears: Number(b.usefulLifeYears) || 10,
        workingHoursPerYear: Number(b.workingHoursPerYear) || 2000,
        hoursPer1000Sheets: Number(b.hoursPer1000Sheets) || 0,
        hoursPerPlate: Number(b.hoursPerPlate) || 0,
        depreciationPerHour: rates.perHour,
        depreciationPerMonth: rates.monthly,
        depreciationPer1000: rates.per1000,
        depreciationPerPlate: rates.perPlate,
      },
      include: { press: { select: { id: true, name: true } } },
    });
    return NextResponse.json(toPayload(machine));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
