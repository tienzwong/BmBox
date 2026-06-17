import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "กรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { username: String(username).trim() } });
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true, role: user.role, name: user.name });
  } catch {
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}
