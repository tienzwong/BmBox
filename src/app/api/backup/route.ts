import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createBackup, listBackups } from "@/lib/backup";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageUsers")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  return NextResponse.json(await listBackups());
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageUsers")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const result = await createBackup();
  return NextResponse.json(result);
}
