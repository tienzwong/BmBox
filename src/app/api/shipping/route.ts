import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";
import { onShippingUpdated } from "@/lib/job-events";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "shipping")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const id = Number(b.id);
  const before = await prisma.shipment.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!before) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const data: Record<string, string | Date | null> = {};
  for (const f of ["carrier", "trackingNo", "address", "note"]) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  if (typeof b.status === "string") {
    data.status = b.status;
    if (b.status === "shipped") data.shippedAt = new Date();
  }

  const rec = await prisma.shipment.update({ where: { id }, data });

  const jobBefore = before.job;
  if (rec.status === "delivered") {
    await prisma.job.updateMany({ where: { id: rec.jobId }, data: { stage: "done", status: "done" } });
  } else if (rec.status === "shipped") {
    await prisma.job.updateMany({ where: { id: rec.jobId, stage: "shipping" }, data: { stage: "done" } });
  }

  const job = await prisma.job.findUnique({ where: { id: rec.jobId } });
  if (job) {
    const stageAdvanced = jobBefore.stage !== job.stage || jobBefore.status !== job.status;
    await onShippingUpdated(
      { status: before.status, trackingNo: before.trackingNo },
      { status: rec.status, trackingNo: rec.trackingNo, jobId: rec.jobId },
      { id: job.id, code: job.code, stage: job.stage, status: job.status },
      user,
      stageAdvanced,
      job.status === "done"
    );
  }

  return NextResponse.json({ ok: true });
}
