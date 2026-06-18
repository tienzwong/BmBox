import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";
import { onPostpressUpdated } from "@/lib/job-events";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "postpress")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const id = Number(b.id);
  const before = await prisma.postpress.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!before) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const data: Record<string, string> = {};
  if (typeof b.status === "string") data.status = b.status;
  if (typeof b.note === "string") data.note = b.note;
  if (Array.isArray(b.processes)) data.processes = JSON.stringify(b.processes);

  const rec = await prisma.postpress.update({ where: { id }, data });

  const jobStageBefore = before.job.stage;
  if (rec.status === "done") {
    await prisma.job.updateMany({ where: { id: rec.jobId, stage: "postpress" }, data: { stage: "shipping" } });
  }

  const job = await prisma.job.findUnique({ where: { id: rec.jobId } });
  if (job) {
    const stageAdvanced = jobStageBefore === "postpress" && job.stage === "shipping";
    await onPostpressUpdated(
      { status: before.status, processes: before.processes },
      rec,
      { id: job.id, code: job.code, stage: job.stage },
      user,
      stageAdvanced
    );
  }

  return NextResponse.json({ ok: true });
}
