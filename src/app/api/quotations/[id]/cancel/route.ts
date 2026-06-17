import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "createQuotation")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.job.findFirst({ where: { quotationId: Number(id) } });
  if (existing) {
    return NextResponse.json({ error: "ออกใบสั่งงานแล้ว ยกเลิกไม่ได้" }, { status: 400 });
  }
  await prisma.quotation.update({ where: { id: Number(id) }, data: { status: "cancelled" } });
  return NextResponse.json({ ok: true });
}
