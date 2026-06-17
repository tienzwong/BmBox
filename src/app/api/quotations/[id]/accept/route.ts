import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { acceptQuotation } from "@/lib/jobs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "createQuotation")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const { id } = await params;
    const { qty } = await req.json();
    if (!qty || qty <= 0) return NextResponse.json({ error: "กรุณาเลือกยอดพิมพ์" }, { status: 400 });
    const { job, soNumber } = await acceptQuotation(Number(id), Number(qty));
    return NextResponse.json({ jobId: job.id, jobCode: job.code, soNumber });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ผิดพลาด" }, { status: 500 });
  }
}
