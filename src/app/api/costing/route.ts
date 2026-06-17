import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/auth/permissions";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canAccessModule(user.role, "costing")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const b = await req.json();
  if (!b.jobId || !b.category || b.amount == null) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }
  const entry = await prisma.costEntry.create({
    data: {
      jobId: Number(b.jobId),
      category: b.category,
      amount: Number(b.amount),
      note: b.note || null,
    },
  });
  return NextResponse.json(entry);
}
