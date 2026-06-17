import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "postpress")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const data: Record<string, string> = {};
  if (typeof b.status === "string") data.status = b.status;
  if (typeof b.note === "string") data.note = b.note;
  if (Array.isArray(b.processes)) data.processes = JSON.stringify(b.processes);

  const rec = await prisma.postpress.update({ where: { id: Number(b.id) }, data });

  if (rec.status === "done") {
    await prisma.job.updateMany({ where: { id: rec.jobId, stage: "postpress" }, data: { stage: "shipping" } });
  }
  return NextResponse.json({ ok: true });
}
