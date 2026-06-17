// ----------------------------------------------------------------------------
// BmBox ERP — เครื่องคำนวณการวางตำแหน่งงานพิมพ์บนแผ่นกระดาษ (imposition)
// เป้าหมาย: หาจำนวนชิ้นต่อแผ่น (ups) ให้ได้มากที่สุด เพื่อใช้กระดาษคุ้มสุด
// หน่วยทั้งหมดเป็นเซนติเมตร (cm)
// ----------------------------------------------------------------------------

export interface ImpositionInput {
  sheetW: number; // ขนาดแผ่นใหญ่
  sheetH: number;
  pieceW: number; // ขนาดงานสำเร็จ
  pieceH: number;
  bleed?: number; // ตัดตก รอบชิ้น (เพิ่มเข้าไปในขนาดชิ้น) — ค่าเดียวใช้ทุกด้าน
  gap?: number; // ระยะห่างระหว่างชิ้น (ร่องมีด)
  edge?: number; // ขอบกระดาษที่ใช้ไม่ได้ รอบด้าน
  gripper?: number; // ขอบคาบ (gripper) ด้านท้าย ใช้พิมพ์ไม่ได้
  allowRotate?: boolean; // อนุญาตหมุนชิ้น 90°
}

export interface PlacedRect {
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
}

export interface ImpositionResult {
  ups: number; // จำนวนชิ้นต่อแผ่น
  rects: PlacedRect[]; // ตำแหน่งชิ้นสำหรับวาดภาพ
  efficiency: number; // 0..1 พื้นที่ที่ใช้ได้จริง / พื้นที่แผ่น
  wastePct: number; // เปอร์เซ็นต์เสีย = (1 - efficiency) * 100
  method: string; // วิธีที่ให้ผลดีที่สุด (อธิบายได้)
  sheetW: number;
  sheetH: number;
  usableW: number;
  usableH: number;
  offsetX: number;
  offsetY: number;
}

interface Candidate {
  ups: number;
  rects: PlacedRect[];
  method: string;
}

function gridRects(
  ox: number,
  oy: number,
  regionW: number,
  regionH: number,
  w: number,
  h: number,
  gap: number,
  rotated: boolean
): PlacedRect[] {
  if (w <= 0 || h <= 0) return [];
  const cols = Math.floor((regionW + gap) / (w + gap));
  const rows = Math.floor((regionH + gap) / (h + gap));
  const rects: PlacedRect[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      rects.push({
        x: ox + i * (w + gap),
        y: oy + j * (h + gap),
        w,
        h,
        rotated,
      });
    }
  }
  return rects;
}

export function calcImposition(input: ImpositionInput): ImpositionResult {
  const {
    sheetW,
    sheetH,
    bleed = 0,
    gap = 0,
    edge = 0,
    gripper = 0,
    allowRotate = true,
  } = input;

  // ขนาดชิ้นจริงรวมตัดตก
  const w = input.pieceW + bleed * 2;
  const h = input.pieceH + bleed * 2;

  const offsetX = edge;
  const offsetY = gripper; // ขอบคาบอยู่ด้านบน
  const usableW = sheetW - edge * 2;
  const usableH = sheetH - gripper - edge;

  const empty: ImpositionResult = {
    ups: 0,
    rects: [],
    efficiency: 0,
    wastePct: 100,
    method: "ชิ้นใหญ่กว่าแผ่น",
    sheetW,
    sheetH,
    usableW,
    usableH,
    offsetX,
    offsetY,
  };

  if (w <= 0 || h <= 0 || usableW <= 0 || usableH <= 0) return empty;

  const candidates: Candidate[] = [];

  // 1) กริดตรง (ไม่หมุน)
  {
    const rects = gridRects(offsetX, offsetY, usableW, usableH, w, h, gap, false);
    candidates.push({ ups: rects.length, rects, method: "วางตรงทั้งแผ่น" });
  }

  // 2) กริดหมุน 90°
  if (allowRotate) {
    const rects = gridRects(offsetX, offsetY, usableW, usableH, h, w, gap, true);
    candidates.push({ ups: rects.length, rects, method: "หมุน 90° ทั้งแผ่น" });
  }

  if (allowRotate) {
    const maxCols = Math.floor((usableW + gap) / (w + gap));
    // 3) ตัดผสมแนวตั้ง: ซ้าย a คอลัมน์วางตรง, ขวาที่เหลือวางแบบหมุน
    for (let a = 0; a <= maxCols; a++) {
      const leftW = a > 0 ? a * (w + gap) - gap : 0;
      const left = gridRects(offsetX, offsetY, leftW, usableH, w, h, gap, false);
      const rightStart = a > 0 ? leftW + gap : 0;
      const rightW = usableW - rightStart;
      const right = gridRects(offsetX + rightStart, offsetY, rightW, usableH, h, w, gap, true);
      const rects = [...left, ...right];
      candidates.push({ ups: rects.length, rects, method: `ตัดผสม (แนวตั้ง ${a} คอลัมน์ตรง)` });
    }

    const maxRows = Math.floor((usableH + gap) / (h + gap));
    // 4) ตัดผสมแนวนอน: บน b แถววางตรง, ล่างที่เหลือวางแบบหมุน
    for (let b = 0; b <= maxRows; b++) {
      const topH = b > 0 ? b * (h + gap) - gap : 0;
      const top = gridRects(offsetX, offsetY, usableW, topH, w, h, gap, false);
      const bottomStart = b > 0 ? topH + gap : 0;
      const bottomH = usableH - bottomStart;
      const bottom = gridRects(offsetX, offsetY + bottomStart, usableW, bottomH, h, w, gap, true);
      const rects = [...top, ...bottom];
      candidates.push({ ups: rects.length, rects, method: `ตัดผสม (แนวนอน ${b} แถวตรง)` });
    }
  }

  const pieceArea = w * h;
  const sheetArea = sheetW * sheetH;

  let best = candidates[0];
  for (const c of candidates) {
    if (c.ups > best.ups) best = c;
  }

  const efficiency = sheetArea > 0 ? (best.ups * pieceArea) / sheetArea : 0;

  return {
    ups: best.ups,
    rects: best.rects,
    efficiency,
    wastePct: (1 - efficiency) * 100,
    method: best.method,
    sheetW,
    sheetH,
    usableW,
    usableH,
    offsetX,
    offsetY,
  };
}

// ----------------------------------------------------------------------------
// การวางแผนเครื่องพิมพ์ออฟเซ็ต — ตัดซอยแผ่นใหญ่ให้พอดีขนาดพิมพ์ของเครื่อง
// (เช่น เครื่องตัด 4 / ตัด 2) แล้วจึงวางชิ้นงานบนแผ่นพิมพ์
// ----------------------------------------------------------------------------
export interface PressSpec {
  id?: number;
  name: string;
  maxW: number; // ขนาดพิมพ์สูงสุดของเครื่อง (ซม.)
  maxH: number;
  gripper?: number; // ขอบคาบของเครื่อง (ซม.)
  platePerColor: number; // ค่าเพลทต่อสี
  printPer1000: number; // ค่าพิมพ์ต่อ 1,000 แผ่น ต่อสี
}

export interface PressPlan {
  press: PressSpec;
  nx: number; // จำนวนซอยตามแนวกว้างของแผ่นใหญ่
  ny: number; // จำนวนซอยตามแนวยาว
  cellW: number; // ขนาดแผ่นพิมพ์ (หลังตัดซอย)
  cellH: number;
  cutsPerParent: number; // จำนวนแผ่นพิมพ์ต่อแผ่นใหญ่ 1 แผ่น
  imp: ImpositionResult; // การวางชิ้นบนแผ่นพิมพ์
  upsPerPressSheet: number; // ชิ้นต่อแผ่นพิมพ์
  upsPerParent: number; // ชิ้นต่อแผ่นใหญ่
  fits: boolean;
}

interface PiecePlanInput {
  pieceW: number;
  pieceH: number;
  bleed?: number;
  gap?: number;
  edge?: number;
}

/// วางแผนตัดซอยแผ่นใหญ่ (parentW × parentH) เป็นแผ่นพิมพ์เท่า ๆ กันที่พอดีเครื่อง
/// เลือกวิธีที่ได้ชิ้นต่อแผ่นใหญ่มากที่สุด (กระดาษคุ้มสุด) ถ้าเท่ากันเลือกซอยน้อยกว่า
export function planPressSheet(
  parentW: number,
  parentH: number,
  piece: PiecePlanInput,
  press: PressSpec
): PressPlan {
  const gripper = press.gripper ?? 1;
  const EPS = 1e-6;
  const MAXN = 10;

  const build = (nx: number, ny: number): PressPlan => {
    const cellW = parentW / nx;
    const cellH = parentH / ny;
    const imp = calcImposition({
      sheetW: cellW,
      sheetH: cellH,
      pieceW: piece.pieceW,
      pieceH: piece.pieceH,
      bleed: piece.bleed,
      gap: piece.gap,
      edge: piece.edge,
      gripper,
      allowRotate: true,
    });
    const cuts = nx * ny;
    return {
      press,
      nx,
      ny,
      cellW,
      cellH,
      cutsPerParent: cuts,
      imp,
      upsPerPressSheet: imp.ups,
      upsPerParent: cuts * imp.ups,
      fits: imp.ups > 0,
    };
  };

  let best: PressPlan | null = null;
  for (let nx = 1; nx <= MAXN; nx++) {
    for (let ny = 1; ny <= MAXN; ny++) {
      const cellW = parentW / nx;
      const cellH = parentH / ny;
      const fitNormal = cellW <= press.maxW + EPS && cellH <= press.maxH + EPS;
      const fitRot = cellW <= press.maxH + EPS && cellH <= press.maxW + EPS;
      if (!fitNormal && !fitRot) continue;
      const cand = build(nx, ny);
      if (
        !best ||
        cand.upsPerParent > best.upsPerParent ||
        (cand.upsPerParent === best.upsPerParent && cand.cutsPerParent < best.cutsPerParent)
      ) {
        best = cand;
      }
    }
  }

  return best ?? { ...build(1, 1), fits: false };
}

// ----------------------------------------------------------------------------
// จำนวนแผ่นพิมพ์ + แผ่นใหญ่ที่ต้องใช้ (รวมเผื่อเสีย/เซ็ตเครื่อง)
// ----------------------------------------------------------------------------
export interface RunInput {
  quantity: number;
  upsPerPressSheet: number;
  cutsPerParent: number;
  spoilagePct?: number;
  makeReady?: number;
}

export function calcRun({
  quantity,
  upsPerPressSheet,
  cutsPerParent,
  spoilagePct = 3,
  makeReady = 50,
}: RunInput) {
  if (upsPerPressSheet <= 0 || cutsPerParent <= 0) {
    return { netPress: 0, spoilage: 0, pressSheets: 0, parentSheets: 0 };
  }
  const netPress = Math.ceil(quantity / upsPerPressSheet);
  const spoilage = Math.ceil((netPress * spoilagePct) / 100) + makeReady;
  const pressSheets = netPress + spoilage;
  const parentSheets = Math.ceil(pressSheets / cutsPerParent);
  return { netPress, spoilage, pressSheets, parentSheets };
}

// ----------------------------------------------------------------------------
// วางแผนงานตามประเภท (Layout Category)
//   twoSide = งาน 2 หน้า (ใบปลิว/แผ่นพับ/สติกเกอร์)
//   book    = งานหนังสือ/แคตตาล็อก (ระบุจำนวนหน้า → คำนวณยก/signature)
//   set     = งานเป็นชุด (ใบเสร็จ/สมุด ใช้เพลทกรอบเดียว, ระบุชุดต่อเล่ม)
// ----------------------------------------------------------------------------
export type LayoutCategory = "twoSide" | "book" | "set";

export interface JobLayoutInput {
  category: LayoutCategory;
  parentW: number;
  parentH: number;
  piece: PiecePlanInput;
  press: PressSpec;
  quantity: number; // ยอดพิมพ์ (ชิ้น/เล่ม)
  colorsFront: number;
  colorsBack: number;
  pageCount?: number; // book
  setsPerBook?: number; // set
  spoilagePct?: number;
  makeReady?: number;
}

export interface JobLayout {
  plan: PressPlan;
  signatures: number; // จำนวนยกพิมพ์ (twoSide/set = 1)
  plateCount: number; // จำนวนกรอบเพลทรวม
  totalColors: number;
  netPress: number; // แผ่นพิมพ์สุทธิ
  spoilage: number;
  pressSheets: number; // แผ่นพิมพ์รวมเผื่อเสีย
  parentSheets: number; // แผ่นใหญ่ที่ต้องซื้อ
  fits: boolean;
}

/// วางแผนงานพิมพ์แบบครบ (เลือกประเภทงาน) — คืนจำนวนแผ่น/เพลท/ยก พร้อมใช้คิดต้นทุน
export function planJobLayout(input: JobLayoutInput): JobLayout {
  const {
    category,
    parentW,
    parentH,
    piece,
    press,
    quantity,
    colorsFront,
    colorsBack,
    pageCount = 0,
    setsPerBook = 1,
    spoilagePct = 3,
    makeReady = 50,
  } = input;

  const plan = planPressSheet(parentW, parentH, piece, press);
  const totalColors = colorsFront + colorsBack;
  const ups = plan.upsPerPressSheet;
  const cuts = plan.cutsPerParent;

  const empty: JobLayout = {
    plan,
    signatures: 1,
    plateCount: totalColors,
    totalColors,
    netPress: 0,
    spoilage: 0,
    pressSheets: 0,
    parentSheets: 0,
    fits: false,
  };
  if (!plan.fits || ups <= 0) return empty;

  let signatures = 1;
  let netPress = 0;
  let plateCount = totalColors;

  if (category === "book") {
    // หนังสือ: แต่ละแผ่นพิมพ์ลงได้ ups หน้า/ด้าน × 2 ด้าน
    const pagesPerSheet = ups * 2;
    signatures = Math.max(1, Math.ceil((pageCount || 2) / pagesPerSheet));
    netPress = signatures * quantity; // เล่มละ 1 แผ่นต่อยก
    plateCount = signatures * totalColors; // เพลทต่อยก × สี
  } else if (category === "set") {
    // งานเป็นชุด: รวมจำนวนชุด = ยอดเล่ม × ชุดต่อเล่ม, ใช้เพลทกรอบเดียว
    const totalSets = quantity * Math.max(1, setsPerBook);
    netPress = Math.ceil(totalSets / ups);
    signatures = 1;
    plateCount = totalColors; // เพลทกรอบเดียว (ต่อสี)
  } else {
    // 2 หน้า ปกติ
    netPress = Math.ceil(quantity / ups);
    signatures = 1;
    plateCount = totalColors;
  }

  const spoilage = Math.ceil((netPress * spoilagePct) / 100) + makeReady * signatures;
  const pressSheets = netPress + spoilage;
  const parentSheets = Math.ceil(pressSheets / cuts);

  return {
    plan,
    signatures,
    plateCount,
    totalColors,
    netPress,
    spoilage,
    pressSheets,
    parentSheets,
    fits: true,
  };
}

// ----------------------------------------------------------------------------
// แผ่นที่ต้องใช้ + เผื่อเสีย
// ----------------------------------------------------------------------------
export interface SheetsInput {
  quantity: number;
  ups: number;
  spoilagePct?: number; // เผื่อเสีย %
  makeReady?: number; // แผ่นเซ็ตเครื่อง (ต่องาน)
}

export function calcSheets({ quantity, ups, spoilagePct = 3, makeReady = 50 }: SheetsInput) {
  if (ups <= 0) return { netSheets: 0, spoilage: 0, sheetsNeeded: 0 };
  const netSheets = Math.ceil(quantity / ups);
  const spoilage = Math.ceil(netSheets * (spoilagePct / 100)) + makeReady;
  return { netSheets, spoilage, sheetsNeeded: netSheets + spoilage };
}

// ----------------------------------------------------------------------------
// น้ำหนักกระดาษ — ใช้แปลงราคา/กิโล เป็นราคา/แผ่น
// น้ำหนัก (กรัม) = พื้นที่ (ตร.ม.) * แกรม
// ----------------------------------------------------------------------------
export function sheetWeightKg(sheetW: number, sheetH: number, grammage: number) {
  const areaM2 = (sheetW / 100) * (sheetH / 100);
  return (areaM2 * grammage) / 1000;
}

export function pricePerSheetFromKg(sheetW: number, sheetH: number, grammage: number, pricePerKg: number) {
  return sheetWeightKg(sheetW, sheetH, grammage) * pricePerKg;
}
