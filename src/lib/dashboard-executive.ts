import { JOB_STAGE } from "@/lib/labels";
import { num } from "@/lib/format";

export interface ExecutiveMetrics {
  totalJobs: number;
  remainingJobs: number;
  doneJobs: number;
  completionRate: number;
  estimatingCount: number;
  holdCount: number;
  prepressCount: number;
  inProgressCount: number;
  stageCounts: { stage: string; count: number }[];
  jobTypeCounts: { label: string; count: number }[];
}

export function buildExecutiveMetrics(input: {
  stageCounts: { stage: string; count: number }[];
  estimatingCount: number;
  holdCount: number;
  jobs: { quotation: { jobType: string | null } | null }[];
}): ExecutiveMetrics {
  const map = new Map(input.stageCounts.map((s) => [s.stage, s.count]));
  const doneJobs = map.get("done") ?? 0;
  const prepressCount = map.get("prepress") ?? 0;
  const inProgressCount =
    (map.get("production") ?? 0) + (map.get("postpress") ?? 0) + (map.get("shipping") ?? 0);
  const activeJobs = prepressCount + inProgressCount;
  const totalJobs = activeJobs + doneJobs + input.estimatingCount;
  const remainingJobs = activeJobs + input.estimatingCount;
  const completionRate = totalJobs > 0 ? Math.round((doneJobs / totalJobs) * 100) : 0;

  const typeMap = new Map<string, number>();
  for (const j of input.jobs) {
    if (j.quotation?.jobType) {
      const t = j.quotation.jobType;
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
    }
  }
  const jobTypeCounts = [...typeMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    totalJobs,
    remainingJobs,
    doneJobs,
    completionRate,
    estimatingCount: input.estimatingCount,
    holdCount: input.holdCount,
    prepressCount,
    inProgressCount,
    stageCounts: input.stageCounts,
    jobTypeCounts,
  };
}

export function executiveInsight(m: ExecutiveMetrics): string {
  const topStage = [...m.stageCounts]
    .filter((s) => s.stage !== "done")
    .sort((a, b) => b.count - a.count)[0];
  const stageLabel = topStage ? (JOB_STAGE[topStage.stage]?.label ?? topStage.stage) : "-";
  const topType = m.jobTypeCounts[0]?.label ?? "ไม่ระบุ";
  return `ขณะนี้มีงานคงค้าง ${num(m.remainingJobs)} ใบ · ขั้นที่หนาแน่นสุดคือ ${stageLabel} (${num(topStage?.count ?? 0)}) · ลักษณะงานที่พบบ่อย: ${topType}`;
}

export function executiveRecommendation(m: ExecutiveMetrics): string {
  if (m.holdCount > 0) {
    return `มีงานพัก ${num(m.holdCount)} ใบ — ควรตรวจสอบสาเหตุและกำหนดวัน due date ให้ชัด`;
  }
  if (m.estimatingCount >= 5) {
    return `ใบเสนอราคารอรับงาน ${num(m.estimatingCount)} ใบ — ฝ่ายขายควร follow up ลูกค้าเพื่อปิดยอด`;
  }
  if (m.prepressCount >= 3) {
    return `คิวพรีเพลส ${num(m.prepressCount)} งาน — ตรวจสอบการอนุมัติแบบและทำเพลทให้ทันก่อนส่งผลิต`;
  }
  if (m.completionRate >= 80) {
    return `อัตราเสร็จ ${m.completionRate}% ดี — โฟกัสลดงานค้างใน ${JOB_STAGE.production?.label} และ ${JOB_STAGE.postpress?.label}`;
  }
  return `อัตราเสร็จ ${m.completionRate}% — ติดตามงานในแต่ละแผนกผ่านแถบสถานะด้านบน`;
}
