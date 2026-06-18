import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const machines = [
  {
    name: "เครื่องยิงเพลท แม่พิมพ์ (CTP)",
    department: "prepress",
    category: "plate_maker",
    unitLabel: "เครื่องที่ 1",
    pressName: null,
    purchasePrice: 3_500_000,
    salvageValue: 200_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0,
    hoursPerPlate: 0.05,
  },
  {
    name: "เครื่องพิมพ์ Offset ตัด 4",
    department: "printing",
    category: "offset_cut4",
    unitLabel: null,
    pressName: "เครื่องตัด 4 (GTO52)",
    purchasePrice: 15_000_000,
    salvageValue: 800_000,
    usefulLifeYears: 15,
    hoursPer1000Sheets: 0.8,
  },
  {
    name: "เครื่องพิมพ์ Offset ตัด 2",
    department: "printing",
    category: "offset_cut2",
    unitLabel: null,
    pressName: "เครื่องตัด 2 (SM74)",
    purchasePrice: 8_000_000,
    salvageValue: 500_000,
    usefulLifeYears: 15,
    hoursPer1000Sheets: 0.8,
  },
  {
    name: "เครื่องตัดผ่ากระดาษ",
    department: "postpress",
    category: "paper_cutter",
    unitLabel: "เครื่องที่ 1",
    pressName: null,
    purchasePrice: 1_500_000,
    salvageValue: 100_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.12,
  },
  {
    name: "เครื่องตัดผ่ากระดาษ",
    department: "postpress",
    category: "paper_cutter",
    unitLabel: "เครื่องที่ 2",
    pressName: null,
    purchasePrice: 1_500_000,
    salvageValue: 100_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.12,
  },
  {
    name: "เครื่องปั้มไดคัท",
    department: "postpress",
    category: "die_cut",
    unitLabel: "เครื่องที่ 1",
    pressName: null,
    purchasePrice: 2_000_000,
    salvageValue: 150_000,
    usefulLifeYears: 12,
    hoursPer1000Sheets: 0.2,
  },
  {
    name: "เครื่องปั้มไดคัท",
    department: "postpress",
    category: "die_cut",
    unitLabel: "เครื่องที่ 2",
    pressName: null,
    purchasePrice: 2_000_000,
    salvageValue: 150_000,
    usefulLifeYears: 12,
    hoursPer1000Sheets: 0.2,
  },
  {
    name: "เครื่องปะกาว",
    department: "postpress",
    category: "gluing",
    unitLabel: "เครื่องที่ 1",
    pressName: null,
    purchasePrice: 800_000,
    salvageValue: 50_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.18,
  },
];

function depreciationFields(m) {
  const years = Math.max(1, m.usefulLifeYears);
  const annual = Math.max(0, (m.purchasePrice - m.salvageValue) / years);
  const monthly = annual / 12;
  const hours = 2000;
  const perHour = annual / hours;
  const per1000 = m.hoursPer1000Sheets > 0 ? perHour * m.hoursPer1000Sheets : 0;
  const perPlate = m.hoursPerPlate > 0 ? perHour * m.hoursPerPlate : 0;
  return {
    depreciationPerHour: perHour,
    depreciationPerMonth: monthly,
    depreciationPer1000: per1000,
    depreciationPerPlate: perPlate,
    workingHoursPerYear: hours,
  };
}

async function main() {
  let added = 0;
  for (const m of machines) {
    const exists = await prisma.machine.findFirst({
      where: { name: m.name, unitLabel: m.unitLabel },
    });
    if (exists) continue;
    let pressId = null;
    if (m.pressName) {
      const press = await prisma.press.findFirst({ where: { name: m.pressName } });
      pressId = press?.id ?? null;
    }
    await prisma.machine.create({
      data: {
        name: m.name,
        department: m.department,
        category: m.category,
        unitLabel: m.unitLabel,
        pressId,
        purchasePrice: m.purchasePrice,
        salvageValue: m.salvageValue,
        usefulLifeYears: m.usefulLifeYears,
        hoursPer1000Sheets: m.hoursPer1000Sheets ?? 0,
        hoursPerPlate: m.hoursPerPlate ?? 0,
        ...depreciationFields(m),
      },
    });
    added++;
  }
  console.log(`seed-machines: เพิ่ม ${added} เครื่อง (ข้ามที่มีอยู่แล้ว)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
