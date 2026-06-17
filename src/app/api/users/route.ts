import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can, isRole } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageUsers")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, name: true, role: true, department: true, active: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role, "manageUsers")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const b = await req.json();
    const username = String(b.username || "").trim();
    if (!username || !b.password || !b.name || !isRole(b.role)) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return NextResponse.json({ error: "มีชื่อผู้ใช้นี้แล้ว" }, { status: 409 });

    const created = await prisma.user.create({
      data: {
        username,
        name: b.name,
        role: b.role,
        department: b.department || null,
        passwordHash: hashPassword(String(b.password)),
      },
      select: { id: true },
    });
    return NextResponse.json({ id: created.id });
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
