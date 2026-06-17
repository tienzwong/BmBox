// ป้ายภาษาไทย + สีของสถานะต่าง ๆ ในแต่ละโมดูล

export interface Opt {
  value: string;
  label: string;
  cls: string;
}

export const JOB_STAGE: Record<string, Opt> = {
  prepress: { value: "prepress", label: "พรีเพลส", cls: "bg-violet-50 text-violet-700" },
  production: { value: "production", label: "กำลังผลิต", cls: "bg-blue-50 text-blue-700" },
  postpress: { value: "postpress", label: "หลังพิมพ์", cls: "bg-amber-50 text-amber-700" },
  shipping: { value: "shipping", label: "รอจัดส่ง", cls: "bg-cyan-50 text-cyan-700" },
  done: { value: "done", label: "เสร็จสิ้น", cls: "bg-green-50 text-green-700" },
};

export const DESIGN_STATUS: Opt[] = [
  { value: "waiting", label: "รอออกแบบ", cls: "bg-slate-100 text-slate-600" },
  { value: "designing", label: "กำลังออกแบบ", cls: "bg-blue-50 text-blue-700" },
  { value: "proofing", label: "รออนุมัติแบบ", cls: "bg-amber-50 text-amber-700" },
  { value: "approved", label: "อนุมัติแล้ว", cls: "bg-green-50 text-green-700" },
];

export const PLATE_STATUS: Opt[] = [
  { value: "waiting", label: "รอทำเพลท", cls: "bg-slate-100 text-slate-600" },
  { value: "making", label: "กำลังทำเพลท", cls: "bg-blue-50 text-blue-700" },
  { value: "done", label: "ทำเพลทเสร็จ", cls: "bg-green-50 text-green-700" },
];

export const PRODUCTION_STATUS: Opt[] = [
  { value: "queued", label: "รอผลิต", cls: "bg-slate-100 text-slate-600" },
  { value: "printing", label: "กำลังพิมพ์", cls: "bg-blue-50 text-blue-700" },
  { value: "done", label: "พิมพ์เสร็จ", cls: "bg-green-50 text-green-700" },
];

export const POSTPRESS_STATUS: Opt[] = [
  { value: "queued", label: "รอดำเนินการ", cls: "bg-slate-100 text-slate-600" },
  { value: "working", label: "กำลังทำ", cls: "bg-blue-50 text-blue-700" },
  { value: "done", label: "เสร็จแล้ว", cls: "bg-green-50 text-green-700" },
];

export const SHIPMENT_STATUS: Opt[] = [
  { value: "preparing", label: "เตรียมจัดส่ง", cls: "bg-slate-100 text-slate-600" },
  { value: "shipped", label: "จัดส่งแล้ว", cls: "bg-blue-50 text-blue-700" },
  { value: "delivered", label: "ส่งถึงแล้ว", cls: "bg-green-50 text-green-700" },
];

export const PO_STATUS: Record<string, Opt> = {
  draft: { value: "draft", label: "ร่าง", cls: "bg-slate-100 text-slate-600" },
  ordered: { value: "ordered", label: "สั่งซื้อแล้ว", cls: "bg-blue-50 text-blue-700" },
  received: { value: "received", label: "รับของแล้ว", cls: "bg-green-50 text-green-700" },
};

export const COST_CATEGORY: Record<string, string> = {
  paper: "ค่ากระดาษ",
  plate: "ค่าเพลท",
  ink: "ค่าหมึก",
  labor: "ค่าแรง",
  outsource: "จ้างนอก",
  other: "อื่น ๆ",
};

export function optLabel(opts: Opt[], value: string): Opt {
  return opts.find((o) => o.value === value) ?? { value, label: value, cls: "bg-slate-100 text-slate-600" };
}
