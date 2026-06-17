import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { safeBackupPath } from "@/lib/backup";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageUsers")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const file = new URL(req.url).searchParams.get("file") || "";
  const full = safeBackupPath(file);
  if (!full) return NextResponse.json({ error: "ชื่อไฟล์ไม่ถูกต้อง" }, { status: 400 });
  try {
    const buf = await fs.readFile(full);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
  }
}
