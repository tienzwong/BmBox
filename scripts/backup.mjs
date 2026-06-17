// สำรองฐานข้อมูล SQLite แบบ consistent (VACUUM INTO) + เก็บย้อนหลัง 12 ไฟล์
// ใช้กับ cron บน VPS:  npm run db:backup
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(process.cwd(), "backups");
const KEEP = 12;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const file = `bmbox-${stamp()}.db`;
  const dest = path.join(BACKUP_DIR, file).replace(/'/g, "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${dest}'`);

  // หมุนเวียนไฟล์เก่า
  const names = (await fs.readdir(BACKUP_DIR)).filter((n) => n.endsWith(".db"));
  const stats = await Promise.all(
    names.map(async (n) => ({ n, m: (await fs.stat(path.join(BACKUP_DIR, n))).mtimeMs }))
  );
  stats.sort((a, b) => b.m - a.m);
  for (const old of stats.slice(KEEP)) {
    await fs.rm(path.join(BACKUP_DIR, old.n), { force: true });
  }

  const st = await fs.stat(path.join(BACKUP_DIR, file));
  console.log(`Backup สำเร็จ: ${file} (${(st.size / 1024 / 1024).toFixed(2)} MB) · เก็บไว้ ${Math.min(stats.length, KEEP)} ไฟล์`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Backup ล้มเหลว:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
