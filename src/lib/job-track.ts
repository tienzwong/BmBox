import { computeJobProgress, type JobProgressInput } from "@/lib/job-progress";
import { JOB_STAGE } from "@/lib/labels";

export type JobTrackTone = "done" | "progress" | "hold" | "cancelled";

export interface JobTrackSummary {
  headline: string;
  subline: string;
  tone: JobTrackTone;
  stageLabel: string;
  percent: number;
}

export function summarizeJobTrack(job: JobProgressInput): JobTrackSummary {
  const steps = computeJobProgress(job);
  const doneCount = steps.filter((s) => s.state === "done").length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const stageLabel = JOB_STAGE[job.stage]?.label ?? job.stage;
  const active = steps.find((s) => s.state === "active");

  if (job.status === "cancelled") {
    return {
      headline: "งานถูกยกเลิก",
      subline: stageLabel,
      tone: "cancelled",
      stageLabel,
      percent,
    };
  }

  if (job.stage === "done" || job.status === "done") {
    return {
      headline: "เสร็จแล้ว",
      subline: "ส่งมอบงานเรียบร้อย",
      tone: "done",
      stageLabel: "เสร็จสิ้น",
      percent: 100,
    };
  }

  if (job.status === "hold") {
    return {
      headline: "พักงานชั่วคราว",
      subline: active?.subLabel ?? stageLabel,
      tone: "hold",
      stageLabel,
      percent,
    };
  }

  const inProduction = job.stage === "production" && job.production?.status === "printing";
  const headline =
    job.stage === "prepress"
      ? "กำลังเตรียมงาน"
      : inProduction || job.stage === "production"
        ? "กำลังผลิต"
        : job.stage === "postpress"
          ? "กำลังหลังพิมพ์"
          : job.stage === "shipping"
            ? "กำลังจัดส่ง"
            : "กำลังดำเนินการ";

  return {
    headline,
    subline: active?.subLabel ?? stageLabel,
    tone: "progress",
    stageLabel,
    percent,
  };
}
