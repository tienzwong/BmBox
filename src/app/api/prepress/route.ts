import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";
import { onPrepressUpdated } from "@/lib/job-events";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "prepress")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const id = Number(b.id);
  const before = await prisma.prepress.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!before) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const data: Record<string, string> = {};
  for (const f of ["designStatus", "plateStatus", "assignee", "note"]) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  const rec = await prisma.prepress.update({ where: { id }, data });

  const jobStageBefore = before.job.stage;
  if (rec.designStatus === "approved" && rec.plateStatus === "done") {
    await prisma.job.updateMany({
      where: { id: rec.jobId, stage: "prepress" },
      data: { stage: "production" },
    });
  }

  const job = await prisma.job.findUnique({ where: { id: rec.jobId } });
  if (job) {
    const stageAdvanced = jobStageBefore === "prepress" && job.stage === "production";
    await onPrepressUpdated(
      { designStatus: before.designStatus, plateStatus: before.plateStatus },
      rec,
      { id: job.id, code: job.code, stage: job.stage },
      user,
      stageAdvanced
    );
  }

  return NextResponse.json({ ok: true });
}
