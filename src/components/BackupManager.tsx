"use client";

import { useEffect, useState } from "react";
import { thaiDate } from "@/lib/format";

interface BackupFile {
  file: string;
  size: number;
  mtime: string;
}

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function BackupManager() {
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/backup");
    if (res.ok) setFiles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setCreating(true);
    await fetch("/api/backup", { method: "POST" });
    setCreating(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">สำรองข้อมูลด้วยตนเอง</h2>
          <p className="text-xs text-slate-400">สร้าง snapshot ฐานข้อมูลทันที (เก็บย้อนหลัง 12 ไฟล์)</p>
        </div>
        <button onClick={create} disabled={creating} className="btn-primary">
          {creating ? "กำลังสำรอง…" : "⛁ สำรองข้อมูลเดี๋ยวนี้"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold text-slate-700">
          ไฟล์สำรอง ({files.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">กำลังโหลด…</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">ยังไม่มีไฟล์สำรอง</div>
        ) : (
          <div className="table-scroll">
            <table>
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">ไฟล์</th>
                <th className="px-5 py-2.5 font-medium">วันที่</th>
                <th className="px-5 py-2.5 text-right font-medium">ขนาด</th>
                <th className="px-5 py-2.5 text-right font-medium">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.file} className="border-t border-line hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{f.file}</td>
                  <td className="px-5 py-3 text-slate-500">{thaiDate(f.mtime)}</td>
                  <td className="px-5 py-3 text-right text-slate-500">{mb(f.size)}</td>
                  <td className="px-5 py-3 text-right">
                    <a href={`/api/backup/download?file=${encodeURIComponent(f.file)}`}
                      className="text-brand-600 hover:underline">ดาวน์โหลด</a>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
