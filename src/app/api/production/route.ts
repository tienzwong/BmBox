import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";
import { onProductionUpdated } from "@/lib/job-events";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "production")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const id = Number(b.id);
  const before = await prisma.production.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!before) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const data: Record<string, string | number> = {};
  if (typeof b.status === "string") data.status = b.status;
  if (typeof b.note === "string") data.note = b.note;
  if (b.printedSheets != null) data.printedSheets = Number(b.printedSheets);

  const rec = await prisma.production.update({ where: { id }, data });

  const jobStageBefore = before.job.stage;
  if (rec.status === "done") {
    await prisma.job.updateMany({ where: { id: rec.jobId, stage: "production" }, data: { stage: "postpress" } });
  }

  const job = await prisma.job.findUnique({ where: { id: rec.jobId } });
  if (job) {
    const stageAdvanced = jobStageBefore === "production" && job.stage === "postpress";
    await onProductionUpdated(
      { status: before.status, printedSheets: before.printedSheets },
      rec,
      { id: job.id, code: job.code, stage: job.stage },
      user,
      stageAdvanced
    );
  }

  return NextResponse.json({ ok: true });
}
