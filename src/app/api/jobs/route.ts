import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createJobFromQuotation } from "@/lib/jobs";
import { recordJobCreated } from "@/lib/job-events";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "createQuotation")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const { quotationId } = await req.json();
    if (!quotationId) return NextResponse.json({ error: "ไม่มีใบเสนอราคา" }, { status: 400 });

    const qid = Number(quotationId);
    const existing = await prisma.job.findFirst({ where: { quotationId: qid } });
    const job = await createJobFromQuotation(qid);
    if (!existing) {
      await recordJobCreated({ id: job.id, code: job.code, title: job.title }, user);
    }
    return NextResponse.json({ id: job.id, code: job.code });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ผิดพลาด" }, { status: 500 });
  }
}
