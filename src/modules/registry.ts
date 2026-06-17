// ----------------------------------------------------------------------------
// BmBox ERP — ทะเบียนโมดูล (Module Registry)
// แต่ละแผนกเป็นโมดูลอิสระ: แก้ไขโค้ดในโฟลเดอร์ src/modules/<key> และ route ของ
// ตัวเองได้โดยไม่กระทบโมดูลอื่น navigation/สิทธิ์อ่านจากทะเบียนนี้ที่เดียว
// ----------------------------------------------------------------------------
import type { ModuleKey } from "@/lib/auth/permissions";

export interface ModuleDef {
  key: ModuleKey;
  name: string; // ชื่อแสดงผล
  short: string; // ชื่อย่อบนเมนู
  path: string; // base path ของโมดูล
  icon: string;
  accent: string; // สีประจำโมดูล (tailwind text color class)
  order: number;
  description: string;
}

export const MODULES: ModuleDef[] = [
  { key: "quotation", name: "ใบเสนอราคา", short: "ใบเสนอราคา", path: "/quotations", icon: "▤", accent: "text-brand-600", order: 1, description: "เสนอราคา + คำนวณกระดาษ/แผ่นพิมพ์" },
  { key: "prepress", name: "พรีเพลส", short: "พรีเพลส", path: "/prepress", icon: "✎", accent: "text-violet-600", order: 2, description: "ออกแบบ และทำแม่พิมพ์ (เพลท)" },
  { key: "production", name: "ฝ่ายผลิต", short: "ผลิต", path: "/production", icon: "⎙", accent: "text-blue-600", order: 3, description: "เครื่องพิมพ์ออฟเซ็ต" },
  { key: "postpress", name: "ฝ่ายหลังพิมพ์", short: "หลังพิมพ์", path: "/postpress", icon: "✄", accent: "text-amber-600", order: 4, description: "เคลือบ/ไดคัท/ปะกล่อง ฯลฯ" },
  { key: "purchasing", name: "จัดซื้อ", short: "จัดซื้อ", path: "/purchasing", icon: "🛒", accent: "text-emerald-600", order: 5, description: "ใบสั่งซื้อ + ผู้ขาย" },
  { key: "inventory", name: "คลังสินค้า", short: "คลัง", path: "/inventory", icon: "▥", accent: "text-teal-600", order: 6, description: "วัตถุดิบ/สต๊อก" },
  { key: "costing", name: "บัญชีต้นทุน", short: "ต้นทุน", path: "/costing", icon: "₿", accent: "text-rose-600", order: 7, description: "ต้นทุนประมาณการ vs จริง" },
  { key: "shipping", name: "จัดส่ง", short: "จัดส่ง", path: "/shipping", icon: "🚚", accent: "text-cyan-600", order: 8, description: "จัดส่งสินค้าให้ลูกค้า" },
];

export function getModule(key: ModuleKey): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
