import type { LayoutCategory } from "@/lib/imposition";

/** รูปแบบไฟล์ import Final Packaging v1 (.bmboxpack.json) */
export interface BmboxPackagingFileV1 {
  version: 1;
  title?: string;
  jobType?: string;
  spec?: string;
  note?: string;
  items?: PackagingItemImport[];
  packaging?: {
    imageBase64?: string;
    imageName?: string;
    dieline?: DielineImport;
  };
}

export interface PackagingItemImport {
  description?: string;
  pieceW?: number;
  pieceH?: number;
  bleed?: number;
  layoutCategory?: LayoutCategory;
  pageCount?: number;
  setsPerBook?: number;
  colorsFront?: number;
  colorsBack?: number;
}

export interface DielineImport {
  /** SVG เส้นไดคัท (แสดง preview) */
  svg?: string;
  /** ความยาวรอบเส้นไดคัท (ซม.) — ใช้คำนวณต้นทุน */
  perimeterCm?: number;
  /** จำนวนมีด/จุดตัด */
  knifeCount?: number;
  /** ต้นทุนไดคัทเหมา (บาท) — ถ้าระบุจะใช้ค่านี้แทนการคำนวณ */
  dieCutCost?: number;
}

export interface PackagingImportResult {
  title: string;
  jobType: string;
  specDetail: string;
  note: string;
  items: PackagingItemImport[];
  imageDataUrl: string | null;
  imageName: string | null;
  dielineSvg: string | null;
  dieCutCost: number | null;
  dieline: DielineImport | null;
  warnings: string[];
}

const BLOCK_COST = 1500;
const PER_CM = 8;

export function estimateDieCutCost(dieline?: DielineImport | null): number | null {
  if (!dieline) return null;
  if (dieline.dieCutCost != null && dieline.dieCutCost >= 0) return dieline.dieCutCost;
  if (dieline.perimeterCm == null || dieline.perimeterCm <= 0) return null;
  const knives = Math.max(1, dieline.knifeCount ?? 1);
  return Math.round(BLOCK_COST + dieline.perimeterCm * PER_CM * knives);
}

function normalizeImage(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (s.startsWith("data:image/")) return s;
  return `data:image/png;base64,${s}`;
}

function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}

function isV1(data: unknown): data is BmboxPackagingFileV1 {
  return typeof data === "object" && data != null && (data as BmboxPackagingFileV1).version === 1;
}

/** อ่านไฟล์ .bmboxpack.json หรือ .json ที่มี version:1 */
export function parsePackagingFile(text: string, fileName: string): PackagingImportResult {
  const warnings: string[] = [];
  let data: unknown;
  try {
    data = parseJson(text);
  } catch {
    throw new Error("ไฟล์ไม่ใช่ JSON ที่อ่านได้");
  }
  if (!isV1(data)) {
    throw new Error('ไฟล์ต้องมี "version": 1 — ดูตัวอย่างที่ public/samples/final-packaging.example.json');
  }

  const item0 = data.items?.[0];
  if (!item0?.pieceW || !item0?.pieceH) {
    warnings.push("ไม่พบขนาดชิ้นงาน (pieceW/pieceH) — กรุณาตรวจสอบหลัง import");
  }

  const dieCutCost = estimateDieCutCost(data.packaging?.dieline);
  if (data.packaging?.dieline && dieCutCost == null) {
    warnings.push("มีเส้นไดคัทแต่ไม่มี perimeterCm — ต้องกรอกค่าไดคัทเอง");
  }

  const imageDataUrl = normalizeImage(data.packaging?.imageBase64);
  if (data.packaging?.imageBase64 && !imageDataUrl) {
    warnings.push("รูปภาพไม่ถูกต้อง — ข้ามการแสดง preview");
  }
  if (imageDataUrl && imageDataUrl.length > 400_000) {
    warnings.push("รูปภาพใหญ่มาก — จะเก็บเฉพาะ preview ย่อใน meta");
  }

  return {
    title: data.title ?? fileName.replace(/\.(json|bmboxpack)$/i, ""),
    jobType: data.jobType ?? "",
    specDetail: data.spec ?? "",
    note: data.note ?? "",
    items: data.items ?? [],
    imageDataUrl,
    imageName: data.packaging?.imageName ?? null,
    dielineSvg: data.packaging?.dieline?.svg ?? null,
    dieCutCost,
    dieline: data.packaging?.dieline ?? null,
    warnings,
  };
}
