// ----------------------------------------------------------------------------
// BlessMotive ERP — เป้าหมายบัญชี (Hybrid C) และ KPI ต่อช่วง
// อัปเดตเมื่อเข้า C1/C2 — ตัวเลขเป้าหมายปรับได้ตามนโยบายบริษัท
// ----------------------------------------------------------------------------

export type AccountingPhase = "C0" | "C1" | "C2" | "C3" | "C4";

export const CURRENT_ACCOUNTING_PHASE: AccountingPhase = "C0";

/** เป้าเก็บเงินรายเดือน (บาท) — 0 = ยังไม่ตั้งเป้า */
export function monthlyCollectionTarget(): number {
  const raw = process.env.ACCOUNTING_MONTHLY_TARGET;
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export interface PhaseGoal {
  phase: AccountingPhase;
  title: string;
  deadline: string;
  kpis: { label: string; target: string; metricKey?: string }[];
  done: boolean;
}

export const HYBRID_PHASE_GOALS: PhaseGoal[] = [
  {
    phase: "C0",
    title: "รากฐานบัญชี + สรุป/เตือน",
    deadline: "สัปดาห์ 1–2",
    done: false,
    kpis: [
      { label: "นโยบายรับรู้รายได้ + export FA", target: "บัญชี sign-off", metricKey: "policy_signed" },
      { label: "Dashboard สรุปบัญชี + เตือน", target: "ใช้งานได้", metricKey: "summary_panel" },
      { label: "Schema เอกสารการค้า", target: "ออกแบบเสร็จ", metricKey: "schema_ready" },
    ],
  },
  {
    phase: "C1",
    title: "Order-to-Cash ใน ERP",
    deadline: "เดือน 1–2",
    done: false,
    kpis: [
      { label: "ใบส่งของ + ใบกำกับ + ใบเสร็จ", target: "ออกเอกสารได้", metricKey: "billing_docs" },
      { label: "AR aging", target: "รายงานค้างชำระ", metricKey: "ar_aging" },
      { label: "Export FlowAccount", target: "รายวัน/สัปดาห์", metricKey: "fa_export" },
      { label: "Dashboard รายได้", target: "จากยอดเก็บจริง ไม่ใช่แค่ QT", metricKey: "revenue_from_receipt" },
    ],
  },
  {
    phase: "C2",
    title: "จัดซื้อ + AP draft",
    deadline: "เดือน 2–3",
    done: false,
    kpis: [
      { label: "GR จาก PO", target: "รับของเข้าระบบ", metricKey: "gr" },
      { label: "Export AP ไป FA", target: "รายสัปดาห์", metricKey: "ap_export" },
    ],
  },
  {
    phase: "C3",
    title: "คลัง + ต้นทุน Job",
    deadline: "เดือน 3–5",
    done: false,
    kpis: [
      { label: "เบิกวัตถุดิบเข้า Job", target: "มี ledger", metricKey: "material_issue" },
      { label: "กำไรต่อ Job", target: "รายได้ − ต้นทุนจริง", metricKey: "job_profit" },
    ],
  },
  {
    phase: "C4",
    title: "ประเมินย้าย GL",
    deadline: "เดือน 6+",
    done: false,
    kpis: [
      { label: "AR ตรง FA 3 เดือน", target: "reconcile ผ่าน", metricKey: "ar_reconcile" },
      { label: "Month-end rehearsal", target: "sandbox สำเร็จ", metricKey: "month_end_rehearsal" },
    ],
  },
];

export function currentPhaseGoals(): PhaseGoal {
  return HYBRID_PHASE_GOALS.find((g) => g.phase === CURRENT_ACCOUNTING_PHASE) ?? HYBRID_PHASE_GOALS[0];
}
