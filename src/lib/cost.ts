// ----------------------------------------------------------------------------
// BmBox ERP — โมเดลคำนวณต้นทุน/ราคา ต่อรายการในใบเสนอราคา
// ค่าเพลท/ค่าพิมพ์ มาจากเครื่องพิมพ์ที่เลือก ส่วนค่ากระดาษคิดจากแผ่นใหญ่
// รองรับงานหนังสือ (หลายยก) และงานเป็นชุด ผ่าน plateCount/pressSheets ที่ส่งเข้ามา
// ----------------------------------------------------------------------------

export interface CostRates {
  coatingPerSheet: number; // เคลือบ ต่อแผ่นพิมพ์ (บาท)
  dieCut: number; // ค่าไดคัท/บล็อก (เหมาต่องาน)
  marginPct: number; // กำไร %
}

export const DEFAULT_RATES: CostRates = {
  coatingPerSheet: 0,
  dieCut: 0,
  marginPct: 30,
};

export interface CostInput {
  parentSheets: number; // แผ่นใหญ่ที่ต้องซื้อ
  pressSheets: number; // แผ่นพิมพ์ (จำนวนรอบป้อนเข้าเครื่อง)
  pricePerParentSheet: number; // ราคาแผ่นใหญ่/แผ่น
  plateCount: number; // จำนวนกรอบเพลทที่ต้องใช้ (รวมทุกยก/ทุกสี)
  totalColors: number; // จำนวนสีรวม หน้า+หลัง (ใช้คิดค่าพิมพ์)
  platePerColor: number; // จากเครื่องพิมพ์
  printPer1000: number; // จากเครื่องพิมพ์
  rates: CostRates;
  // โหมดราคา: ถ้าระบุ unitPrice + quantity จะคิดกำไรจากราคาขายตรง
  priceMode?: "margin" | "unit";
  unitPrice?: number;
  quantity?: number;
}

export interface CostBreakdown {
  paperCost: number;
  plateCost: number;
  printCost: number;
  coatingCost: number;
  dieCutCost: number;
  depreciationCost: number;
  baseCost: number;
  margin: number;
  total: number;
  unitPrice: number;
}

export function calcCost({
  parentSheets,
  pressSheets,
  pricePerParentSheet,
  plateCount,
  totalColors,
  platePerColor,
  printPer1000,
  rates,
  depreciationCost = 0,
  priceMode = "margin",
  unitPrice,
  quantity = 0,
}: CostInput & { depreciationCost?: number }): CostBreakdown {
  const paperCost = parentSheets * pricePerParentSheet;
  const plateCost = plateCount * platePerColor;
  // ค่าพิมพ์คิดตามแผ่นพิมพ์ที่ป้อนเข้าเครื่อง × จำนวนสีรวม
  const printCost = (pressSheets / 1000) * totalColors * printPer1000;
  const coatingCost = pressSheets * rates.coatingPerSheet;
  const dieCutCost = rates.dieCut;
  const baseCost = paperCost + plateCost + printCost + coatingCost + dieCutCost + depreciationCost;

  let total: number;
  let margin: number;
  let finalUnit: number;

  if (priceMode === "unit" && unitPrice != null && quantity > 0) {
    finalUnit = unitPrice;
    total = unitPrice * quantity;
    margin = total - baseCost;
  } else {
    margin = baseCost * (rates.marginPct / 100);
    total = baseCost + margin;
    finalUnit = quantity > 0 ? total / quantity : 0;
  }

  return {
    paperCost,
    plateCost,
    printCost,
    coatingCost,
    dieCutCost,
    depreciationCost,
    baseCost,
    margin,
    total,
    unitPrice: finalUnit,
  };
}
