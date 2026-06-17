import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "shipping")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const data: Record<string, string | Date | null> = {};
  for (const f of ["carrier", "trackingNo", "address", "note"]) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  if (typeof b.status === "string") {
    data.status = b.status;
    if (b.status === "shipped") data.shippedAt = new Date();
  }

  const rec = await prisma.shipment.update({ where: { id: Number(b.id) }, data });

  if (rec.status === "delivered") {
    await prisma.job.updateMany({ where: { id: rec.jobId }, data: { stage: "done", status: "done" } });
  } else if (rec.status === "shipped") {
    await prisma.job.updateMany({ where: { id: rec.jobId, stage: "shipping" }, data: { stage: "done" } });
  }
  return NextResponse.json({ ok: true });
}
