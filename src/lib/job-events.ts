import { prisma } from "@/lib/prisma";
import {
  canAccessModule,
  type ModuleKey,
  type SafeUser,
} from "@/lib/auth/permissions";
import {
  DESIGN_STATUS,
  PLATE_STATUS,
  PRODUCTION_STATUS,
  POSTPRESS_STATUS,
  SHIPMENT_STATUS,
  JOB_STAGE,
  optLabel,
  type Opt,
} from "@/lib/labels";
import { STAGE_ORDER } from "@/lib/jobs";

export type JobEventType = "created" | "status_change" | "stage_change";
export type JobEventModule = "job" | "prepress" | "production" | "postpress" | "shipping";

interface RecordOpts {
  jobId: number;
  jobCode: string;
  type: JobEventType;
  module: JobEventModule;
  title: string;
  detail?: string;
  meta?: Record<string, unknown>;
  actor?: Pick<SafeUser, "id" | "name"> | null;
  notifyModules?: ModuleKey[];
}

const ALWAYS_NOTIFY: ModuleKey[] = ["quotation"];

async function recipientUserIds(modules: ModuleKey[], actorId?: number): Promise<number[]> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, role: true },
  });
  const ids = new Set<number>();
  for (const u of users) {
    if (actorId && u.id === actorId) continue;
    if (u.role === "admin" || u.role === "management") {
      ids.add(u.id);
      continue;
    }
    const allMods = [...modules, ...ALWAYS_NOTIFY];
    if (allMods.some((m) => canAccessModule(u.role, m))) ids.add(u.id);
  }
  return [...ids];
}

export async function recordJobEvent(opts: RecordOpts) {
  const event = await prisma.jobEvent.create({
    data: {
      jobId: opts.jobId,
      type: opts.type,
      module: opts.module,
      title: opts.title,
      detail: opts.detail ?? null,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
      actorId: opts.actor?.id ?? null,
      actorName: opts.actor?.name ?? null,
    },
  });

  const modules = opts.notifyModules ?? [];
  if (modules.length === 0 && opts.type !== "created") return event;

  const userIds = await recipientUserIds(modules, opts.actor?.id);
  if (userIds.length === 0) return event;

  const href = `/jobs/${opts.jobId}`;
  const body = opts.detail ?? `${opts.jobCode}`;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      jobId: opts.jobId,
      eventId: event.id,
      title: opts.title,
      body,
      href,
    })),
  });

  return event;
}

export async function recordJobCreated(
  job: { id: number; code: string; title: string },
  actor?: Pick<SafeUser, "id" | "name"> | null
) {
  return recordJobEvent({
    jobId: job.id,
    jobCode: job.code,
    type: "created",
    module: "job",
    title: `เปิดใบสั่งงาน ${job.code}`,
    detail: job.title,
    actor,
    notifyModules: ["prepress", "production", "postpress", "shipping"],
  });
}

function stageNotifyTarget(stage: string): ModuleKey[] {
  switch (stage) {
    case "production":
      return ["production"];
    case "postpress":
      return ["postpress"];
    case "shipping":
      return ["shipping"];
    case "done":
      return ["quotation", "shipping"];
    default:
      return [];
  }
}

export async function recordStageChange(
  job: { id: number; code: string; stage: string },
  fromStage: string,
  actor?: Pick<SafeUser, "id" | "name"> | null
) {
  const from = JOB_STAGE[fromStage]?.label ?? fromStage;
  const to = JOB_STAGE[job.stage]?.label ?? job.stage;
  return recordJobEvent({
    jobId: job.id,
    jobCode: job.code,
    type: "stage_change",
    module: "job",
    title: `${job.code} → ${to}`,
    detail: `ส่งต่อจาก ${from} ไป ${to}`,
    meta: { from: fromStage, to: job.stage },
    actor,
    notifyModules: stageNotifyTarget(job.stage),
  });
}

function label(opts: Opt[], v: string) {
  return optLabel(opts, v).label;
}

export async function onPrepressUpdated(
  before: { designStatus: string; plateStatus: string },
  after: { designStatus: string; plateStatus: string; jobId: number },
  job: { id: number; code: string; stage: string },
  actor: Pick<SafeUser, "id" | "name"> | null,
  stageAdvanced: boolean
) {
  const events = [];
  if (before.designStatus !== after.designStatus) {
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "prepress",
        title: `พรีเพลส · ออกแบบ: ${label(DESIGN_STATUS, after.designStatus)}`,
        detail: `${before.designStatus} → ${after.designStatus}`,
        meta: { field: "designStatus", from: before.designStatus, to: after.designStatus },
        actor,
        notifyModules: ["prepress"],
      })
    );
  }
  if (before.plateStatus !== after.plateStatus) {
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "prepress",
        title: `พรีเพลส · เพลท: ${label(PLATE_STATUS, after.plateStatus)}`,
        detail: `${before.plateStatus} → ${after.plateStatus}`,
        meta: { field: "plateStatus", from: before.plateStatus, to: after.plateStatus },
        actor,
        notifyModules: ["prepress"],
      })
    );
  }
  if (stageAdvanced && job.stage === "production") {
    events.push(recordStageChange(job, "prepress", actor));
  }
  await Promise.all(events);
}

export async function onProductionUpdated(
  before: { status: string; printedSheets: number },
  after: { status: string; printedSheets: number; jobId: number },
  job: { id: number; code: string; stage: string },
  actor: Pick<SafeUser, "id" | "name"> | null,
  stageAdvanced: boolean
) {
  const events = [];
  if (before.status !== after.status) {
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "production",
        title: `ฝ่ายผลิต · ${label(PRODUCTION_STATUS, after.status)}`,
        detail: `${before.status} → ${after.status}`,
        meta: { field: "status", from: before.status, to: after.status },
        actor,
        notifyModules: ["production"],
      })
    );
  } else if (before.printedSheets !== after.printedSheets) {
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "production",
        title: `ฝ่ายผลิต · พิมพ์แล้ว ${after.printedSheets.toLocaleString()} แผ่น`,
        detail: `${before.printedSheets} → ${after.printedSheets}`,
        meta: { field: "printedSheets", from: before.printedSheets, to: after.printedSheets },
        actor,
        notifyModules: ["production"],
      })
    );
  }
  if (stageAdvanced && job.stage === "postpress") {
    events.push(recordStageChange(job, "production", actor));
  }
  await Promise.all(events);
}

export async function onPostpressUpdated(
  before: { status: string; processes: string },
  after: { status: string; processes: string; jobId: number },
  job: { id: number; code: string; stage: string },
  actor: Pick<SafeUser, "id" | "name"> | null,
  stageAdvanced: boolean
) {
  const events = [];
  if (before.status !== after.status) {
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "postpress",
        title: `หลังพิมพ์ · ${label(POSTPRESS_STATUS, after.status)}`,
        detail: `${before.status} → ${after.status}`,
        meta: { field: "status", from: before.status, to: after.status },
        actor,
        notifyModules: ["postpress"],
      })
    );
  } else if (before.processes !== after.processes) {
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "postpress",
        title: `หลังพิมพ์ · อัปเดตขั้นตอน`,
        detail: job.code,
        meta: { field: "processes" },
        actor,
        notifyModules: ["postpress"],
      })
    );
  }
  if (stageAdvanced && job.stage === "shipping") {
    events.push(recordStageChange(job, "postpress", actor));
  }
  await Promise.all(events);
}

export async function onShippingUpdated(
  before: { status: string; trackingNo: string | null },
  after: { status: string; trackingNo: string | null; jobId: number },
  job: { id: number; code: string; stage: string; status: string },
  actor: Pick<SafeUser, "id" | "name"> | null,
  stageAdvanced: boolean,
  jobDone: boolean
) {
  const events = [];
  if (before.status !== after.status) {
    const detail = after.trackingNo ? `เลขพัสดุ ${after.trackingNo}` : undefined;
    events.push(
      recordJobEvent({
        jobId: job.id,
        jobCode: job.code,
        type: "status_change",
        module: "shipping",
        title: `จัดส่ง · ${label(SHIPMENT_STATUS, after.status)}`,
        detail: detail ?? `${before.status} → ${after.status}`,
        meta: { field: "status", from: before.status, to: after.status },
        actor,
        notifyModules: ["shipping", "quotation"],
      })
    );
  }
  if (stageAdvanced && (job.stage === "done" || jobDone)) {
    const from = jobDone && job.status === "done" ? "shipping" : "shipping";
    events.push(recordStageChange({ ...job, stage: jobDone ? "done" : job.stage }, from, actor));
  }
}

export function moduleIcon(module: string): string {
  switch (module) {
    case "prepress":
      return "\u{1F3A8}";
    case "production":
      return "\u{1F5A8}\uFE0F";
    case "postpress":
      return "\u2702\uFE0F";
    case "shipping":
      return "\u{1F69A}";
    case "job":
      return "\u{1F4CB}";
    default:
      return "\u2022";
  }
}

export { STAGE_ORDER };
