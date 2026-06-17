import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export async function GET() {
  const papers = await prisma.paper.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(papers);
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "manageMasterData")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const b = await req.json();
    if (!b.name || !b.sheetW || !b.sheetH) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }
    const paper = await prisma.paper.create({
      data: {
        name: b.name,
        grammage: Number(b.grammage) || 0,
        sheetW: Number(b.sheetW),
        sheetH: Number(b.sheetH),
        pricePerKg: b.pricePerKg != null && b.pricePerKg !== "" ? Number(b.pricePerKg) : null,
        pricePerSheet: b.pricePerSheet != null && b.pricePerSheet !== "" ? Number(b.pricePerSheet) : null,
      },
    });
    return NextResponse.json(paper);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
