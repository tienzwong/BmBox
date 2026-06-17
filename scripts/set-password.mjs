// เปลี่ยน/รีเซ็ตรหัสผ่านผู้ใช้ (ใช้ scrypt รูปแบบเดียวกับระบบ)
// ใช้: node scripts/set-password.mjs <username> <newPassword>
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("ใช้งาน: node scripts/set-password.mjs <username> <newPassword>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("รหัสผ่านควรยาวอย่างน้อย 8 ตัวอักษร");
  process.exit(1);
}

function hashPassword(p) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(p, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({
    where: { username },
    data: { passwordHash: hashPassword(password) },
  });
  console.log(`เปลี่ยนรหัสผ่านของ "${user.username}" (${user.name}) เรียบร้อย`);
} catch {
  console.error(`ไม่พบผู้ใช้: ${username}`);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
