// ----------------------------------------------------------------------------
// BmBox ERP — ชั้นประเมินราคา (รวม imposition + cost)
// ใช้สำหรับ Smart Layout: เทียบกระดาษหลายขนาด × เครื่องพิมพ์หลายเครื่อง × ยอดพิมพ์
// แล้วจัดอันดับวิธีผลิตจาก "ดีสุด (ถูก/เสียน้อย)" ไป "แย่สุด"
// ----------------------------------------------------------------------------
import {
  planJobLayout,
  pricePerSheetFromKg,
  type JobLayout,
  type LayoutCategory,
  type PressSpec,
} from "@/lib/imposition";
import { calcCost, type CostBreakdown, type CostRates } from "@/lib/cost";

export interface PaperLike {
  id: number;
  name: string;
  grammage: number;
  sheetW: number;
  sheetH: number;
  pricePerKg: number | null;
  pricePerSheet: number | null;
}

export interface PressLike extends PressSpec {
  id: number;
}

export interface EstimateParams {
  category: LayoutCategory;
  pieceW: number;
  pieceH: number;
  bleed: number;
  gap: number;
  edge: number;
  colorsFront: number;
  colorsBack: number;
  pageCount?: number;
  setsPerBook?: number;
  spoilagePct: number;
  makeReady: number;
  rates: CostRates;
  priceMode?: "margin" | "unit";
  unitPrice?: number;
}

export interface PlanResult {
  paper: PaperLike;
  press: PressLike;
  quantity: number;
  layout: JobLayout;
  pricePerSheet: number;
  cost: CostBreakdown;
  rank: number; // 1 = ดีที่สุด
}

export function paperPricePerSheet(paper: PaperLike): number {
  return (
    paper.pricePerSheet ??
    (paper.pricePerKg
      ? pricePerSheetFromKg(paper.sheetW, paper.sheetH, paper.grammage, paper.pricePerKg)
      : 0)
  );
}

/// ประเมินแผนเดียว (กระดาษ+เครื่อง+ยอด) — คืน null ถ้าวางไม่ลง
export function evaluatePlan(
  paper: PaperLike,
  press: PressLike,
  quantity: number,
  params: EstimateParams
): PlanResult | null {
  const layout = planJobLayout({
    category: params.category,
    parentW: paper.sheetW,
    parentH: paper.sheetH,
    piece: { pieceW: params.pieceW, pieceH: params.pieceH, bleed: params.bleed, gap: params.gap, edge: params.edge },
    press,
    quantity,
    colorsFront: params.colorsFront,
    colorsBack: params.colorsBack,
    pageCount: params.pageCount,
    setsPerBook: params.setsPerBook,
    spoilagePct: params.spoilagePct,
    makeReady: params.makeReady,
  });
  if (!layout.fits) return null;

  const pricePerSheet = paperPricePerSheet(paper);
  const cost = calcCost({
    parentSheets: layout.parentSheets,
    pressSheets: layout.pressSheets,
    pricePerParentSheet: pricePerSheet,
    plateCount: layout.plateCount,
    totalColors: layout.totalColors,
    platePerColor: press.platePerColor,
    printPer1000: press.printPer1000,
    rates: params.rates,
    priceMode: params.priceMode,
    unitPrice: params.unitPrice,
    quantity,
  });

  return { paper, press, quantity, layout, pricePerSheet, cost, rank: 0 };
}

/// จัดอันดับทุกวิธี (กระดาษหลายขนาด × เครื่องหลายเครื่อง) สำหรับยอดพิมพ์เดียว
/// เรียงจากต้นทุนรวมต่ำสุด (เสียน้อยสุด) ขึ้นก่อน
export function rankPlans(
  papers: PaperLike[],
  presses: PressLike[],
  quantity: number,
  params: EstimateParams
): PlanResult[] {
  const results: PlanResult[] = [];
  for (const paper of papers) {
    for (const press of presses) {
      const r = evaluatePlan(paper, press, quantity, params);
      if (r) results.push(r);
    }
  }
  results.sort((a, b) => {
    if (a.cost.baseCost !== b.cost.baseCost) return a.cost.baseCost - b.cost.baseCost;
    // ต้นทุนเท่ากัน: เลือกที่ประสิทธิภาพการวางสูงกว่า
    return b.layout.plan.imp.efficiency - a.layout.plan.imp.efficiency;
  });
  results.forEach((r, i) => (r.rank = i + 1));
  return results;
}

/// แผนที่ดีที่สุดสำหรับยอดพิมพ์เดียว
export function bestPlan(
  papers: PaperLike[],
  presses: PressLike[],
  quantity: number,
  params: EstimateParams
): PlanResult | null {
  return rankPlans(papers, presses, quantity, params)[0] ?? null;
}
