// ----------------------------------------------------------------------------
// BmBox ERP — คำนวณค่าเสื่อมราคาเครื่องจักร (ตามทะเบียน BlessMotive)
// ----------------------------------------------------------------------------

export type MachineDepartment = "prepress" | "printing" | "postpress";

export type MachineCategory =
  | "plate_maker"
  | "offset_cut2"
  | "offset_cut4"
  | "silk_screen"
  | "folding"
  | "paper_cutter"
  | "die_cut"
  | "gluing"
  | "coating";

/** กลุ่มแสดงผลตามเอกสารทะเบียนเครื่องจักร */
export const MACHINE_GROUPS: { label: string; categories: MachineCategory[] }[] = [
  { label: "เครื่องพิมพ์ Offset", categories: ["offset_cut4", "offset_cut2", "silk_screen"] },
  { label: "เครื่องพับกระดาษ", categories: ["folding"] },
  { label: "เครื่องตัดกระดาษ", categories: ["paper_cutter"] },
  { label: "เครื่องปะกาว", categories: ["gluing"] },
  { label: "เครื่องปั๊มไดคัท", categories: ["die_cut"] },
  { label: "เครื่องเคลือบ", categories: ["coating"] },
  { label: "เครื่องยิงเพลท CTP", categories: ["plate_maker"] },
];

export const MACHINE_DEPARTMENT_LABEL: Record<MachineDepartment, string> = {
  prepress: "พรีเพลส",
  printing: "ฝ่ายพิมพ์",
  postpress: "หลังพิมพ์",
};

export const MACHINE_CATEGORY_LABEL: Record<MachineCategory, string> = {
  plate_maker: "เครื่องยิงเพลท CTP",
  offset_cut4: "Offset ตัด 4",
  offset_cut2: "Offset ตัด 2",
  silk_screen: "Silk Screen",
  folding: "เครื่องพับ",
  paper_cutter: "เครื่องตัดกระดาษ",
  die_cut: "เครื่องปั๊มไดคัท",
  gluing: "เครื่องปะกาว",
  coating: "เครื่องเคลือบ",
};

export interface DepreciationInput {
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  workingHoursPerYear?: number;
  hoursPer1000Sheets?: number;
  hoursPerPlate?: number;
}

export interface DepreciationRates {
  annual: number;
  monthly: number;
  perHour: number;
  per1000: number;
  perPlate: number;
}

export function calcDepreciationRates(input: DepreciationInput): DepreciationRates {
  const years = Math.max(1, input.usefulLifeYears);
  const annual = Math.max(0, (input.purchasePrice - input.salvageValue) / years);
  const monthly = annual / 12;
  const hours = Math.max(1, input.workingHoursPerYear ?? 2000);
  const perHour = annual / hours;
  const h1000 = input.hoursPer1000Sheets ?? 0;
  const per1000 = h1000 > 0 ? perHour * h1000 : 0;
  const hPlate = input.hoursPerPlate ?? 0;
  const perPlate = hPlate > 0 ? perHour * hPlate : 0;
  return { annual, monthly, perHour, per1000, perPlate };
}

export function depreciationForPressSheets(pressSheets: number, per1000Sheets: number): number {
  if (pressSheets <= 0 || per1000Sheets <= 0) return 0;
  return (pressSheets / 1000) * per1000Sheets;
}

export function depreciationForPlates(plateCount: number, perPlate: number): number {
  if (plateCount <= 0 || perPlate <= 0) return 0;
  return plateCount * perPlate;
}

/** ชื่อแสดงในตาราง — ใช้ชื่อเครื่องจากทะเบียน */
export function machineDisplayName(
  name: string,
  shortCode?: string | null,
  unitLabel?: string | null,
): string {
  if (shortCode) return name;
  return unitLabel ? `${name} (${unitLabel})` : name;
}

export function machineUsesPlates(category: string): boolean {
  return category === "plate_maker";
}

export function groupMachinesByCatalog<T extends { category: string }>(machines: T[]) {
  return MACHINE_GROUPS.map((g) => ({
    ...g,
    rows: machines.filter((m) => g.categories.includes(m.category as MachineCategory)),
  })).filter((g) => g.rows.length > 0);
}
