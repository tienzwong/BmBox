import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "prepress")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  const data: Record<string, string> = {};
  for (const f of ["designStatus", "plateStatus", "assignee", "note"]) {
    if (typeof b[f] === "string") data[f] = b[f];
  }
  const rec = await prisma.prepress.update({ where: { id: Number(b.id) }, data });

  // ออกแบบอนุมัติ + ทำเพลทเสร็จ → ส่งต่อฝ่ายผลิต
  if (rec.designStatus === "approved" && rec.plateStatus === "done") {
    await prisma.job.updateMany({
      where: { id: rec.jobId, stage: "prepress" },
      data: { stage: "production" },
    });
  }
  return NextResponse.json({ ok: true });
}
