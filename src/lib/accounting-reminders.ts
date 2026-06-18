// ----------------------------------------------------------------------------
// สรุปและเตือนด้านบัญชี — ใช้ข้อมูลปัจจุบัน (C0) และขยายเมื่อมี billing module (C1)
// ----------------------------------------------------------------------------

import { baht, num } from "@/lib/format";
import { monthlyCollectionTarget, CURRENT_ACCOUNTING_PHASE } from "@/lib/accounting-goals";

export type ReminderSeverity = "info" | "warning" | "urgent";

export interface AccountingReminder {
  id: string;
  severity: ReminderSeverity;
  title: string;
  detail: string;
  href?: string;
  actionLabel?: string;
}

export interface AccountingSummary {
  phase: string;
  /** ยอด QT รับงานแล้ว — proxy รายได้ก่อนมี INV (C0) */
  acceptedQuotationTotal: number;
  acceptedQuotationCount: number;
  /** งานเสร็จแล้ว — รอวางบิลเมื่อยังไม่มี INV */
  jobsAwaitingBilling: number;
  jobsAwaitingBillingAmount: number;
  estimatingCount: number;
  estimatingTotal: number;
  holdJobCount: number;
  poOrderedCount: number;
  /** เป้าเก็บเงินเดือนนี้ */
  monthlyTarget: number;
  /** ยอดเก็บจริงเดือนนี้ — 0 จนกว่าจะมี RCPT (C1) */
  collectedThisMonth: number;
  /** ค้างวางบิลโดยประมาณ */
  unbilledEstimate: number;
  reminders: AccountingReminder[];
}

export interface AccountingSummaryInput {
  acceptedQuotationTotal: number;
  acceptedQuotationCount: number;
  jobsDone: { id: number; code: string; total: number }[];
  estimatingCount: number;
  estimatingTotal: number;
  holdJobCount: number;
  poOrderedCount: number;
  collectedThisMonth?: number;
}

function bangkokNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
}

function isWeekday(d: Date, day: number): boolean {
  return d.getDay() === day;
}

function daysUntilMonthEnd(d: Date): number {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return last - d.getDate();
}

export function buildAccountingReminders(input: AccountingSummaryInput): AccountingReminder[] {
  const reminders: AccountingReminder[] = [];
  const now = bangkokNow();
  const target = monthlyCollectionTarget();

  if (CURRENT_ACCOUNTING_PHASE === "C0") {
    reminders.push({
      id: "phase-c0",
      severity: "info",
      title: "โหมด Hybrid C — ช่วงเตรียมบัญชี (C0)",
      detail:
        "รายได้บน Dashboard ยังอิงยอด QT รับงาน — หลัง C1 จะเปลี่ยนเป็นยอดใบเสร็จ/เก็บเงินจริง และ export ไป FlowAccount",
    });
  }

  if (input.jobsDone.length > 0) {
    reminders.push({
      id: "unbilled-jobs",
      severity: "warning",
      title: `งานเสร็จ ${num(input.jobsDone.length)} ใบ — ยังไม่มีใบแจ้งหนี้ในระบบ`,
      detail: `มูลค่าประมาณ ${baht(input.jobsDone.reduce((s, j) => s + j.total, 0))} จาก QT ที่รับงาน · รอเปิดโมดูล Billing (C1)`,
      href: "/quotations",
      actionLabel: "ดู QT รับงาน",
    });
  }

  if (input.estimatingCount >= 3) {
    reminders.push({
      id: "estimating-pipeline",
      severity: "info",
      title: `ใบเสนอราคารอปิด ${num(input.estimatingCount)} ใบ`,
      detail: `มูลค่ารวมประมาณ ${baht(input.estimatingTotal)} — ปิดการขายจะเพิ่ม pipeline รายได้`,
      href: "/quotations",
      actionLabel: "ติดตาม QT",
    });
  }

  if (input.holdJobCount > 0) {
    reminders.push({
      id: "hold-blocks-billing",
      severity: "urgent",
      title: `งานพัก ${num(input.holdJobCount)} ใบ — อาจชะลอการส่งมอบ/วางบิล`,
      detail: "ตรวจสอบสาเหตุและกำหนดวันดำเนินการต่อ",
      href: "/production",
      actionLabel: "ดูงานผลิต",
    });
  }

  if (input.poOrderedCount > 0) {
    reminders.push({
      id: "po-ordered",
      severity: "info",
      title: `PO สั่งแล้ว ${num(input.poOrderedCount)} ใบ — รอรับของ`,
      detail: "หลัง C2 จะส่ง export ไป FlowAccount เป็นค่าใช้จ่าย/AP",
      href: "/purchasing",
      actionLabel: "ดูจัดซื้อ",
    });
  }

  if (target > 0 && input.collectedThisMonth === 0 && CURRENT_ACCOUNTING_PHASE !== "C1") {
    const pct =
      input.acceptedQuotationTotal > 0
        ? Math.min(100, Math.round((input.acceptedQuotationTotal / target) * 100))
        : 0;
    reminders.push({
      id: "monthly-target-proxy",
      severity: pct < 50 ? "warning" : "info",
      title: `เป้าเก็บเงินเดือนนี้ ${baht(target)}`,
      detail: `ยอด QT รับงานสะสม ${baht(input.acceptedQuotationTotal)} (${pct}% ของเป้า — proxy ก่อนมีใบเสร็จ)`,
    });
  }

  if (isWeekday(now, 2)) {
    reminders.push({
      id: "fa-export-weekly",
      severity: "warning",
      title: "สรุปส่งออกบัญชี → FlowAccount (รายสัปดาห์)",
      detail:
        "ตรวจสอบ QT รับงาน / งานเสร็จที่ต้องวางบิลใน FA · หลัง C1 ใช้ปุ่ม Export จากระบบ",
    });
  }

  const daysLeft = daysUntilMonthEnd(now);
  if (daysLeft <= 5) {
    reminders.push({
      id: "month-end-close",
      severity: "urgent",
      title: `สรุปปลายเดือน — เหลือ ${num(daysLeft)} วัน`,
      detail:
        "Checklist: วางบิลครบใน FA · กระทบลูกหนี้ · ภาษีซื้อ-ขาย · สำรอง DB · สรุปต้นทุน Job ใน ERP",
    });
  }

  return reminders.sort((a, b) => {
    const rank: Record<ReminderSeverity, number> = { urgent: 0, warning: 1, info: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}

export function buildAccountingSummary(input: AccountingSummaryInput): AccountingSummary {
  const unbilledEstimate = input.jobsDone.reduce((s, j) => s + j.total, 0);
  const collectedThisMonth = input.collectedThisMonth ?? 0;

  return {
    phase: CURRENT_ACCOUNTING_PHASE,
    acceptedQuotationTotal: input.acceptedQuotationTotal,
    acceptedQuotationCount: input.acceptedQuotationCount,
    jobsAwaitingBilling: input.jobsDone.length,
    jobsAwaitingBillingAmount: unbilledEstimate,
    estimatingCount: input.estimatingCount,
    estimatingTotal: input.estimatingTotal,
    holdJobCount: input.holdJobCount,
    poOrderedCount: input.poOrderedCount,
    monthlyTarget: monthlyCollectionTarget(),
    collectedThisMonth,
    unbilledEstimate,
    reminders: buildAccountingReminders(input),
  };
}
