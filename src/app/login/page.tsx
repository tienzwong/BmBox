"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEMO = [
  { u: "admin", role: "ผู้ดูแลระบบ" },
  { u: "manager", role: "ผู้บริหาร" },
  { u: "sales", role: "ฝ่ายขาย" },
  { u: "prepress", role: "พรีเพลส" },
  { u: "prod", role: "ฝ่ายผลิต" },
  { u: "postpress", role: "หลังพิมพ์" },
  { u: "buyer", role: "จัดซื้อ" },
  { u: "stock", role: "คลังสินค้า" },
  { u: "account", role: "บัญชีต้นทุน" },
  { u: "ship", role: "จัดส่ง" },
];

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      const next = params.get("next") || "/";
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            Bm
          </div>
          <h1 className="text-lg font-bold text-slate-800">BmBox ERP</h1>
          <p className="text-xs text-slate-400">บริษัท เบลสโมทีฟ จำกัด</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label">ชื่อผู้ใช้</label>
            <input
              className="input"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <details className="mt-4 rounded-lg border border-line bg-white p-3 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">บัญชีตัวอย่าง (รหัสผ่าน = ชื่อผู้ใช้ + 123)</summary>
          <ul className="mt-2 space-y-1">
            {DEMO.map((d) => (
              <li key={d.u} className="flex justify-between">
                <code className="text-brand-700">{d.u}</code>
                <span>{d.role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">* เปลี่ยนรหัสผ่านก่อนใช้งานจริง</p>
        </details>
      </div>
    </div>
  );
}
