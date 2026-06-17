import { STAGE_ORDER } from "@/lib/jobs";
import { JOB_STAGE, optLabel, DESIGN_STATUS, PLATE_STATUS, PRODUCTION_STATUS, POSTPRESS_STATUS, SHIPMENT_STATUS } from "@/lib/labels";

export type StepState = "done" | "active" | "pending";
export type StageKey = (typeof STAGE_ORDER)[number];

export interface ProgressStep {
  key: StageKey;
  label: string;
  state: StepState;
  subLabel?: string;
}

export interface JobProgressInput {
  stage: string;
  status: string;
  prepress?: { designStatus: string; plateStatus: string } | null;
  production?: { status: string; printedSheets: number; plannedSheets: number; pressName?: string | null } | null;
  postpress?: { status: string; processes: string } | null;
  shipment?: { status: string; carrier?: string | null; trackingNo?: string | null } | null;
}

function parseProcesses(json?: string): { name: string; done: boolean }[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as { name: string; done: boolean }[];
  } catch {
    return [];
  }
}

function prepressSub(job: JobProgressInput): string {
  const d = optLabel(DESIGN_STATUS, job.prepress?.designStatus ?? "waiting");
  const p = optLabel(PLATE_STATUS, job.prepress?.plateStatus ?? "waiting");
  return `${d.label} · ${p.label}`;
}

function productionSub(job: JobProgressInput): string {
  const st = optLabel(PRODUCTION_STATUS, job.production?.status ?? "queued");
  const printed = job.production?.printedSheets ?? 0;
  const planned = job.production?.plannedSheets ?? 0;
  if (planned > 0 && job.production?.status === "printing") {
    return `${st.label} ${printed.toLocaleString()}/${planned.toLocaleString()} แผ่น`;
  }
  if (job.production?.pressName) return `${st.label} · ${job.production.pressName}`;
  return st.label;
}

function postpressSub(job: JobProgressInput): string {
  const procs = parseProcesses(job.postpress?.processes);
  if (procs.length === 0) return optLabel(POSTPRESS_STATUS, job.postpress?.status ?? "queued").label;
  const done = procs.filter((p) => p.done).length;
  const summary = procs.map((p) => `${p.done ? "✓" : "○"}${p.name}`).join(" ");
  return `${summary} (${done}/${procs.length})`;
}

function shippingSub(job: JobProgressInput): string {
  const st = optLabel(SHIPMENT_STATUS, job.shipment?.status ?? "preparing");
  if (job.shipment?.trackingNo) return `${st.label} · ${job.shipment.trackingNo}`;
  if (job.shipment?.carrier) return `${st.label} · ${job.shipment.carrier}`;
  return st.label;
}

function subLabelForStage(key: StageKey, job: JobProgressInput): string {
  switch (key) {
    case "prepress":
      return prepressSub(job);
    case "production":
      return productionSub(job);
    case "postpress":
      return postpressSub(job);
    case "shipping":
      return shippingSub(job);
    case "done":
      return "งานเสร็จสมบูรณ์";
  }
}

/// คำนวณสถานะแต่ละขั้นของ progress bar จากข้อมูล Job จริง
export function computeJobProgress(job: JobProgressInput): ProgressStep[] {
  const cancelled = job.status === "cancelled";
  const finished = job.stage === "done" || job.status === "done";
  const currentIdx = finished ? STAGE_ORDER.length : STAGE_ORDER.indexOf(job.stage as StageKey);

  return STAGE_ORDER.map((key, i) => {
    let state: StepState = "pending";
    if (cancelled) {
      state = i <= Math.max(0, currentIdx) ? (i < currentIdx ? "done" : "active") : "pending";
    } else if (finished) {
      state = "done";
    } else if (i < currentIdx) {
      state = "done";
    } else if (i === currentIdx) {
      state = "active";
    }

    const showSub = state === "active" || (state === "done" && key === "done" && finished);
    return {
      key,
      label: JOB_STAGE[key]?.label ?? key,
      state,
      subLabel: showSub ? subLabelForStage(key, job) : undefined,
    };
  });
}

/// ข้อมูลตัวอย่างสำหรับหน้า demo — แสดงหลายสถานะ
export const PROGRESS_DEMO_SAMPLES: { title: string; desc: string; job: JobProgressInput }[] = [
  {
    title: "งานใหม่ — กำลังออกแบบ",
    desc: "JOB อยู่ขั้นพรีเพลส กำลังออกแบบ ยังไม่ทำเพลท",
    job: {
      stage: "prepress",
      status: "open",
      prepress: { designStatus: "designing", plateStatus: "waiting" },
      production: { status: "queued", printedSheets: 0, plannedSheets: 5000, pressName: "เครื่องตัด 4" },
      postpress: { status: "queued", processes: '[{"name":"เคลือบ","done":false},{"name":"ไดคัท","done":false}]' },
      shipment: { status: "preparing" },
    },
  },
  {
    title: "รออนุมัติแบบ + ทำเพลท",
    desc: "ออกแบบเสร็จ รอลูกค้าอนุมัติ และเริ่มทำเพลท",
    job: {
      stage: "prepress",
      status: "open",
      prepress: { designStatus: "proofing", plateStatus: "making" },
      production: { status: "queued", printedSheets: 0, plannedSheets: 8000, pressName: "เครื่องตัด 2" },
      postpress: { status: "queued", processes: "[]" },
      shipment: { status: "preparing" },
    },
  },
  {
    title: "กำลังพิมพ์",
    desc: "ผ่านพรีเพลสแล้ว ฝ่ายผลิตกำลังพิมพ์",
    job: {
      stage: "production",
      status: "open",
      prepress: { designStatus: "approved", plateStatus: "done" },
      production: { status: "printing", printedSheets: 3200, plannedSheets: 8000, pressName: "เครื่องตัด 2 (SM74)" },
      postpress: { status: "queued", processes: '[{"name":"เคลือบ","done":false},{"name":"ไดคัท","done":false},{"name":"ปะกล่อง","done":false}]' },
      shipment: { status: "preparing" },
    },
  },
  {
    title: "หลังพิมพ์ — เคลือบ/ไดคัท",
    desc: "พิมพ์เสร็จ กำลังทำหลังพิมพ์บางขั้น",
    job: {
      stage: "postpress",
      status: "open",
      prepress: { designStatus: "approved", plateStatus: "done" },
      production: { status: "done", printedSheets: 5000, plannedSheets: 5000, pressName: "เครื่องตัด 4" },
      postpress: {
        status: "working",
        processes: '[{"name":"เคลือบ","done":true},{"name":"ไดคัท","done":true},{"name":"ปะกล่อง","done":false}]',
      },
      shipment: { status: "preparing" },
    },
  },
  {
    title: "จัดส่งแล้ว",
    desc: "ส่งของออกจากโรงพิมพ์ รอลูกค้ารับ",
    job: {
      stage: "shipping",
      status: "open",
      prepress: { designStatus: "approved", plateStatus: "done" },
      production: { status: "done", printedSheets: 3000, plannedSheets: 3000, pressName: "เครื่องตัด 4" },
      postpress: { status: "done", processes: '[{"name":"เคลือบ","done":true},{"name":"ไดคัท","done":true}]' },
      shipment: { status: "shipped", carrier: "Kerry", trackingNo: "TH1234567890" },
    },
  },
  {
    title: "เสร็จสิ้น",
    desc: "ส่งถึงลูกค้าแล้ว ปิดงาน",
    job: {
      stage: "done",
      status: "done",
      prepress: { designStatus: "approved", plateStatus: "done" },
      production: { status: "done", printedSheets: 2000, plannedSheets: 2000, pressName: "เครื่องตัด 4" },
      postpress: { status: "done", processes: "[]" },
      shipment: { status: "delivered", carrier: "Flash", trackingNo: "FL9876543210" },
    },
  },
];
