import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// ผู้ใช้เริ่มต้นแต่ละแผนก (รหัสผ่าน = ชื่อผู้ใช้ + "123")
const users = [
  { username: "admin", name: "ผู้ดูแลระบบ", role: "admin", department: "IT" },
  { username: "manager", name: "ผู้จัดการ", role: "management", department: "บริหาร" },
  { username: "sales", name: "พนักงานขาย", role: "sales", department: "ฝ่ายขาย" },
  { username: "prepress", name: "ฝ่ายพรีเพลส", role: "prepress", department: "พรีเพลส" },
  { username: "prod", name: "ฝ่ายผลิต", role: "production", department: "โรงพิมพ์" },
  { username: "postpress", name: "ฝ่ายหลังพิมพ์", role: "postpress", department: "หลังพิมพ์" },
  { username: "buyer", name: "ฝ่ายจัดซื้อ", role: "purchasing", department: "จัดซื้อ" },
  { username: "stock", name: "ฝ่ายคลังสินค้า", role: "inventory", department: "คลังสินค้า" },
  { username: "account", name: "ฝ่ายบัญชีต้นทุน", role: "costing", department: "บัญชีต้นทุน" },
  { username: "ship", name: "ฝ่ายจัดส่ง", role: "shipping", department: "จัดส่ง" },
];

// ขนาดแผ่นมาตรฐานในวงการพิมพ์ไทย (แปลงเป็นเซนติเมตร)
const papers = [
  { name: "อาร์ตการ์ด 350 แกรม", grammage: 350, sheetW: 79, sheetH: 109, pricePerKg: 40 },
  { name: "อาร์ตการ์ด 300 แกรม", grammage: 300, sheetW: 79, sheetH: 109, pricePerKg: 40 },
  { name: "อาร์ตการ์ด 260 แกรม", grammage: 260, sheetW: 65, sheetH: 91, pricePerKg: 40 },
  { name: "อาร์ตมัน 157 แกรม", grammage: 157, sheetW: 65, sheetH: 91, pricePerKg: 38 },
  { name: "กระดาษกล่องแป้งหลังขาว 350 แกรม", grammage: 350, sheetW: 79, sheetH: 109, pricePerKg: 32 },
  { name: "กระดาษกล่องแป้งหลังเทา 400 แกรม", grammage: 400, sheetW: 79, sheetH: 109, pricePerKg: 28 },
  { name: "กระดาษปอนด์ 80 แกรม", grammage: 80, sheetW: 65, sheetH: 91, pricePerKg: 42 },
  { name: "คราฟท์น้ำตาล 250 แกรม", grammage: 250, sheetW: 79, sheetH: 109, pricePerKg: 35 },
];

const customers = [
  { name: "ลูกค้าทั่วไป (เงินสด)" },
  { name: "บริษัท ตัวอย่าง จำกัด", taxId: "0105500000000", phone: "02-000-0000", contact: "ฝ่ายจัดซื้อ" },
];

// เครื่องพิมพ์ออฟเซ็ต (ขนาดพิมพ์สูงสุดโดยประมาณ หน่วย ซม.)
const presses = [
  { name: "เครื่องตัด 4 (GTO52)", maxW: 36, maxH: 52, gripper: 1.0, platePerColor: 150, printPer1000: 250 },
  { name: "เครื่องตัด 2 (SM74)", maxW: 53, maxH: 74, gripper: 1.2, platePerColor: 300, printPer1000: 400 },
];

// เครื่องจักร + ค่าเสื่อมราคา (ราคาทุนเป็นตัวอย่าง — แก้ไขได้ในหน้า ต้นทุน → เครื่องจักร)
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
    hoursPerPlate: 0,
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
    hoursPerPlate: 0,
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
  const perPlate = (m.hoursPerPlate ?? 0) > 0 ? perHour * m.hoursPerPlate : 0;
  return {
    depreciationPerHour: perHour,
    depreciationPerMonth: monthly,
    depreciationPer1000: per1000,
    depreciationPerPlate: perPlate,
    workingHoursPerYear: hours,
  };
}

async function main() {
  for (const p of papers) {
    const exists = await prisma.paper.findFirst({ where: { name: p.name } });
    if (!exists) await prisma.paper.create({ data: p });
  }
  for (const c of customers) {
    const exists = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!exists) await prisma.customer.create({ data: c });
  }
  for (const m of presses) {
    const exists = await prisma.press.findFirst({ where: { name: m.name } });
    if (!exists) await prisma.press.create({ data: m });
  }
  for (const m of machines) {
    const label = m.unitLabel ? `${m.name} (${m.unitLabel})` : m.name;
    const exists = await prisma.machine.findFirst({
      where: { name: m.name, unitLabel: m.unitLabel },
    });
    if (exists) continue;
    let pressId = null;
    if (m.pressName) {
      const press = await prisma.press.findFirst({ where: { name: m.pressName } });
      pressId = press?.id ?? null;
    }
    const dep = depreciationFields(m);
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
        ...dep,
      },
    });
  }
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { username: u.username } });
    if (!exists) {
      await prisma.user.create({ data: { ...u, passwordHash: hashPassword(`${u.username}123`) } });
    }
  }

  // ผู้ขาย + วัตถุดิบในคลัง
  const suppliers = [
    { name: "บจก. กระดาษไทย ซัพพลาย" },
    { name: "ร้านหมึกพิมพ์ มงคล" },
  ];
  for (const s of suppliers) {
    const exists = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.supplier.create({ data: s });
  }
  const invItems = [
    { name: "อาร์ตการ์ด 350 แกรม 79x109", category: "paper", unit: "แผ่น", qtyOnHand: 5000, reorderPoint: 1000 },
    { name: "หมึกพิมพ์ดำ", category: "ink", unit: "กก.", qtyOnHand: 30, reorderPoint: 10 },
    { name: "ลังกระดาษบรรจุ", category: "packaging", unit: "ใบ", qtyOnHand: 200, reorderPoint: 50 },
  ];
  for (const it of invItems) {
    const exists = await prisma.inventoryItem.findFirst({ where: { name: it.name } });
    if (!exists) await prisma.inventoryItem.create({ data: it });
  }

  // ใบสั่งงานตัวอย่าง 1 ใบ จากใบเสนอราคาแรก (ถ้ามี และยังไม่มี job)
  const jobCount = await prisma.job.count();
  if (jobCount === 0) {
    const q = await prisma.quotation.findFirst({ include: { items: true } });
    if (q) {
      const quantity = q.items.reduce((s, it) => s + it.quantity, 0);
      const plannedSheets = q.items.reduce((s, it) => s + it.sheetsNeeded, 0);
      const now = new Date();
      const code = `JOB-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-0001`;
      await prisma.job.create({
        data: {
          code,
          quotationId: q.id,
          customerId: q.customerId,
          title: q.items[0]?.description || "งานตัวอย่าง",
          quantity,
          prepress: { create: {} },
          production: { create: { plannedSheets, pressName: q.items.find((i) => i.pressName)?.pressName ?? null } },
          postpress: { create: { processes: JSON.stringify([{ name: "เคลือบ", done: false }, { name: "ไดคัท", done: false }, { name: "ปะกล่อง", done: false }]) } },
          shipment: { create: {} },
        },
      });
    }
  }
  console.log(
    "Seed เรียบร้อย: กระดาษ", papers.length, "· ลูกค้า", customers.length,
    "· เครื่องพิมพ์", presses.length, "· เครื่องจักร", machines.length, "· ผู้ใช้", users.length,
    "· ผู้ขาย", suppliers.length, "· วัตถุดิบ", invItems.length
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
