import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  can,
  canAccessModule,
  isRole,
  type ModuleKey,
  type Permission,
  type Role,
  type SafeUser,
} from "./permissions";

export const SESSION_COOKIE = "bmbox_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 วัน

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAX_AGE_SEC * 1000);
  await prisma.session.create({ data: { id: token, userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { id: token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (!u.active || !isRole(u.role)) return null;

  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role as Role,
    department: u.department,
  };
}

/// ใช้ในหน้า (server component) — ถ้าไม่ล็อกอินจะเด้งไป /login
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/// ใช้ในหน้า — ถ้าไม่มีสิทธิ์จะเด้งกลับหน้าแรก
export async function requirePermission(permission: Permission): Promise<SafeUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/");
  return user;
}

/// ใช้ในหน้าโมดูล — ถ้าแผนกไม่มีสิทธิ์เข้าโมดูลนี้จะเด้งกลับหน้าแรก
export async function requireModule(moduleKey: ModuleKey): Promise<SafeUser> {
  const user = await requireUser();
  if (!canAccessModule(user.role, moduleKey)) redirect("/");
  return user;
}
