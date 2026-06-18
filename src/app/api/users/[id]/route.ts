import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getCurrentUser();
    if (!actor || !can(actor.role, "manageUsers")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const b = await req.json();
    const name = b.name != null ? String(b.name).trim() : undefined;
    const department =
      b.department === undefined
        ? undefined
        : String(b.department || "").trim() || null;
    const password = b.password != null ? String(b.password) : "";

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อ-สกุล" }, { status: 400 });
    }
    if (password && password.length < 8) {
      return NextResponse.json({ error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }

    const data: { name?: string; department?: string | null; passwordHash?: string } = {};
    if (name !== undefined) data.name = name;
    if (department !== undefined) data.department = department;
    if (password) data.passwordHash = hashPassword(password);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะแก้ไข" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, department: true, active: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
