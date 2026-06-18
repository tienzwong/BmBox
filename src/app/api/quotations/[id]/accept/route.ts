import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { acceptQuotation } from "@/lib/jobs";
import { recordJobCreated } from "@/lib/job-events";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "createQuotation")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const { id } = await params;
    const { qty } = await req.json();
    if (!qty || qty <= 0) return NextResponse.json({ error: "กรุณาเลือกยอดพิมพ์" }, { status: 400 });
    const qid = Number(id);
    const existing = await prisma.job.findFirst({ where: { quotationId: qid } });
    const { job, soNumber } = await acceptQuotation(qid, Number(qty));
    if (!existing) {
      await recordJobCreated({ id: job.id, code: job.code, title: job.title }, user);
    }
    return NextResponse.json({ jobId: job.id, jobCode: job.code, soNumber });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ผิดพลาด" }, { status: 500 });
  }
}
