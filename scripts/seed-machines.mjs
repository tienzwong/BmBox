import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** ทะเบียนเครื่องจักร BlessMotive — ตามเอกสาร PDF (ราคาทุนเป็นค่าเริ่มต้น แก้ได้ในหน้าเครื่องจักร) */
const machines = [
  // เครื่องพิมพ์ Offset
  {
    machineCode: "MC1018",
    name: "Heidelberg M.O. 6 สี [101]",
    shortCode: "MO6 [101]",
    maxSize: '(19"x25.5")',
    minSize: '(11"x12")',
    typeLabel: "ตัด 4",
    location: "บริษัท",
    department: "printing",
    category: "offset_cut4",
    pressName: "เครื่องตัด 4 (GTO52)",
    purchasePrice: 15_000_000,
    salvageValue: 800_000,
    usefulLifeYears: 15,
    hoursPer1000Sheets: 0.8,
    hoursPerPlate: 0,
  },
  {
    machineCode: "MC1037",
    name: "Heidelberg CD102 /6 สี [102]",
    shortCode: "CD102 [102]",
    maxSize: '(27.5"x39.5")',
    minSize: '(15"x23")',
    typeLabel: "ตัด 2",
    location: "บริษัท",
    department: "printing",
    category: "offset_cut2",
    pressName: "เครื่องตัด 2 (SM74)",
    purchasePrice: 8_000_000,
    salvageValue: 500_000,
    usefulLifeYears: 15,
    hoursPer1000Sheets: 0.8,
    hoursPerPlate: 0,
  },
  {
    machineCode: "SPM125",
    name: "NIJIN SPM125",
    shortCode: "NIJIN Screen",
    maxSize: '(28"x40")',
    minSize: '(1"x1")',
    typeLabel: "Silk Screen",
    location: "บริษัท",
    department: "printing",
    category: "silk_screen",
    pressName: null,
    purchasePrice: 2_000_000,
    salvageValue: 100_000,
    usefulLifeYears: 12,
    hoursPer1000Sheets: 0.5,
    hoursPerPlate: 0,
  },
  // เครื่องพับกระดาษ
  {
    machineCode: "MC1033",
    name: "เครื่องพับ SHOEI (1001)",
    shortCode: "SHOEI (1001)",
    maxSize: '(19"x25")',
    minSize: '(14.8"x21.5")',
    typeLabel: "เครื่องพับ",
    location: "บริษัท",
    department: "postpress",
    category: "folding",
    pressName: null,
    purchasePrice: 1_200_000,
    salvageValue: 80_000,
    usefulLifeYears: 12,
    hoursPer1000Sheets: 0.1,
    hoursPerPlate: 0,
  },
  // เครื่องตัดกระดาษ
  {
    machineCode: "MC1025",
    name: "เครื่องตัด Polar EMC. 115 [301]",
    shortCode: "POLA1 [301]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องตัด",
    location: "บริษัท",
    department: "postpress",
    category: "paper_cutter",
    pressName: null,
    purchasePrice: 1_500_000,
    salvageValue: 100_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.12,
    hoursPerPlate: 0,
  },
  {
    machineCode: "MC1031",
    name: "เครื่องตัด Polar EMC. 115 [302]",
    shortCode: "POLA2 [302]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องตัด",
    location: "บริษัท",
    department: "postpress",
    category: "paper_cutter",
    pressName: null,
    purchasePrice: 1_500_000,
    salvageValue: 100_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.12,
    hoursPerPlate: 0,
  },
  {
    machineCode: "MC1032",
    name: "เครื่องตัด Polar EMC. 115 [303]",
    shortCode: "POLA3 [303]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องตัด",
    location: "บริษัท",
    department: "postpress",
    category: "paper_cutter",
    pressName: null,
    purchasePrice: 1_500_000,
    salvageValue: 100_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.12,
    hoursPerPlate: 0,
  },
  // เครื่องปะกาว
  {
    machineCode: "MC1034",
    name: "เครื่องปะกาว IMC [501]",
    shortCode: "IMC [501]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องปะกาว",
    location: "บริษัท",
    department: "postpress",
    category: "gluing",
    pressName: null,
    purchasePrice: 800_000,
    salvageValue: 50_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.18,
    hoursPerPlate: 0,
  },
  // เครื่องปั๊มไดคัท
  {
    machineCode: "MC1026",
    name: "เครื่องปั๊ม BOBST 1080E [401]",
    shortCode: "BOBST [401]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องปั๊ม",
    location: "บริษัท",
    department: "postpress",
    category: "die_cut",
    pressName: null,
    purchasePrice: 2_000_000,
    salvageValue: 150_000,
    usefulLifeYears: 12,
    hoursPer1000Sheets: 0.2,
    hoursPerPlate: 0,
  },
  {
    machineCode: "MC1036",
    name: "เครื่องปั๊ม BOBST1080 [402]",
    shortCode: "BOBST[402]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องปั๊ม",
    location: "บริษัท",
    department: "postpress",
    category: "die_cut",
    pressName: null,
    purchasePrice: 2_000_000,
    salvageValue: 150_000,
    usefulLifeYears: 12,
    hoursPer1000Sheets: 0.2,
    hoursPerPlate: 0,
  },
  {
    machineCode: "MC1050",
    name: "เครื่องปั๊มมือ SJ750 [403]",
    shortCode: "SJ750 [403]",
    maxSize: null,
    minSize: null,
    typeLabel: "เครื่องปั๊มมือ",
    location: "บริษัท",
    department: "postpress",
    category: "die_cut",
    pressName: null,
    purchasePrice: 400_000,
    salvageValue: 20_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.25,
    hoursPerPlate: 0,
  },
  // เครื่องเคลือบ
  {
    machineCode: "MC1035",
    name: "เครื่องเคลือบ SPOT UV",
    shortCode: "UV[201]",
    maxSize: null,
    minSize: null,
    typeLabel: "SPOT UV",
    location: "บริษัท",
    department: "postpress",
    category: "coating",
    pressName: null,
    purchasePrice: 1_800_000,
    salvageValue: 100_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.15,
    hoursPerPlate: 0,
  },
  {
    machineCode: "MC1053",
    name: "เครื่องเคลือบ GuangMing SWAFM-1050",
    shortCode: "SWAFM[1050]",
    maxSize: null,
    minSize: null,
    typeLabel: "เคลือบ",
    location: "บริษัท",
    department: "postpress",
    category: "coating",
    pressName: null,
    purchasePrice: 2_500_000,
    salvageValue: 150_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0.15,
    hoursPerPlate: 0,
  },
  // เครื่องยิงเพลท CTP
  {
    machineCode: "MC1041",
    name: "เครื่องยิงเพลท SCREEN PT-R8600 [801]",
    shortCode: "R8600 [801]",
    maxSize: null,
    minSize: null,
    typeLabel: "CTP",
    location: "บริษัท",
    department: "prepress",
    category: "plate_maker",
    pressName: null,
    purchasePrice: 3_500_000,
    salvageValue: 200_000,
    usefulLifeYears: 10,
    hoursPer1000Sheets: 0,
    hoursPerPlate: 0.05,
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
  let upserted = 0;
  for (const m of machines) {
    let pressId = null;
    if (m.pressName) {
      const press = await prisma.press.findFirst({ where: { name: m.pressName } });
      pressId = press?.id ?? null;
    }
    const dep = depreciationFields(m);
    const data = {
      machineCode: m.machineCode,
      name: m.name,
      shortCode: m.shortCode,
      maxSize: m.maxSize,
      minSize: m.minSize,
      typeLabel: m.typeLabel,
      location: m.location,
      department: m.department,
      category: m.category,
      unitLabel: null,
      pressId,
      purchasePrice: m.purchasePrice,
      salvageValue: m.salvageValue,
      usefulLifeYears: m.usefulLifeYears,
      hoursPer1000Sheets: m.hoursPer1000Sheets ?? 0,
      hoursPerPlate: m.hoursPerPlate ?? 0,
      ...dep,
      active: true,
    };

    let existing = await prisma.machine.findFirst({ where: { machineCode: m.machineCode } });
    if (!existing && pressId) {
      existing = await prisma.machine.findFirst({ where: { pressId } });
    }

    if (existing) {
      if (pressId) {
        await prisma.machine.updateMany({
          where: { pressId, id: { not: existing.id } },
          data: { pressId: null },
        });
      }
      await prisma.machine.update({ where: { id: existing.id }, data });
    } else {
      if (pressId) {
        await prisma.machine.updateMany({ where: { pressId }, data: { pressId: null } });
      }
      await prisma.machine.create({ data });
    }
    upserted++;
  }

  const deactivated = await prisma.machine.updateMany({
    where: { machineCode: null },
    data: { active: false, pressId: null },
  });
  console.log(
    `seed-machines: sync ${upserted} เครื่องจากทะเบียน BlessMotive (ปิดใช้งาน legacy ${deactivated.count} รายการ)`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
