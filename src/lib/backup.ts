import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const BACKUP_DIR = path.join(process.cwd(), "backups");
const KEEP = 12; // เก็บย้อนหลัง 12 ไฟล์ (≈ 12 สัปดาห์)

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/// สร้าง snapshot ฐานข้อมูลแบบ consistent ด้วย SQLite VACUUM INTO
export async function createBackup(): Promise<{ file: string; size: number }> {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const file = `bmbox-${stamp()}.db`;
  const dest = path.join(BACKUP_DIR, file).replace(/'/g, "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${dest}'`);
  await rotate();
  const st = await fs.stat(path.join(BACKUP_DIR, file));
  return { file, size: st.size };
}

export async function listBackups(): Promise<{ file: string; size: number; mtime: string }[]> {
  try {
    const names = (await fs.readdir(BACKUP_DIR)).filter((n) => n.endsWith(".db"));
    const out = await Promise.all(
      names.map(async (file) => {
        const st = await fs.stat(path.join(BACKUP_DIR, file));
        return { file, size: st.size, mtime: st.mtime.toISOString() };
      })
    );
    return out.sort((a, b) => b.mtime.localeCompare(a.mtime));
  } catch {
    return [];
  }
}

async function rotate() {
  const all = await listBackups();
  for (const old of all.slice(KEEP)) {
    await fs.rm(path.join(BACKUP_DIR, old.file), { force: true });
  }
}

/// ตรวจชื่อไฟล์กัน path traversal แล้วคืน absolute path
export function safeBackupPath(file: string): string | null {
  if (!/^bmbox-[0-9-]+\.db$/.test(file)) return null;
  return path.join(BACKUP_DIR, file);
}
