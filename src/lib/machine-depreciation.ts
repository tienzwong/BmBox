// ----------------------------------------------------------------------------
// BmBox ERP — คำนวณค่าเสื่อมราคาเครื่องจักร
// ----------------------------------------------------------------------------

export type MachineDepartment = "prepress" | "printing" | "postpress";

export type MachineCategory =
  | "plate_maker"
  | "offset_cut2"
  | "offset_cut4"
  | "paper_cutter"
  | "die_cut"
  | "gluing";

export const MACHINE_DEPARTMENT_LABEL: Record<MachineDepartment, string> = {
  prepress: "พรีเพลส",
  printing: "พิมพ์",
  postpress: "หลังพิมพ์",
};

export const MACHINE_CATEGORY_LABEL: Record<MachineCategory, string> = {
  plate_maker: "เครื่องยิงเพลท แม่พิมพ์ (CTP)",
  offset_cut2: "เครื่องพิมพ์ Offset ตัด 2",
  offset_cut4: "เครื่องพิมพ์ Offset ตัด 4",
  paper_cutter: "เครื่องตัดผ่ากระดาษ",
  die_cut: "เครื่องปั้มไดคัท",
  gluing: "เครื่องปะกาว",
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

/** ค่าเสื่อมต่องานจากจำนวนแผ่นพิมพ์ */
export function depreciationForPressSheets(pressSheets: number, per1000Sheets: number): number {
  if (pressSheets <= 0 || per1000Sheets <= 0) return 0;
  return (pressSheets / 1000) * per1000Sheets;
}

/** ค่าเสื่อมต่องานจากจำนวนกรอบเพลท (พรีเพลส/CTP) */
export function depreciationForPlates(plateCount: number, perPlate: number): number {
  if (plateCount <= 0 || perPlate <= 0) return 0;
  return plateCount * perPlate;
}

export function machineDisplayName(name: string, unitLabel?: string | null): string {
  return unitLabel ? `${name} (${unitLabel})` : name;
}

export function machineUsesPlates(category: string): boolean {
  return category === "plate_maker";
}
