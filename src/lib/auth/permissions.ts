// ----------------------------------------------------------------------------
// BmBox ERP — บทบาท/สิทธิ์ (module-aware) ใช้ได้ทั้ง server และ client
//   - ModuleKey  : โมดูลของแต่ละแผนก (เข้าถึงได้ตามบทบาท)
//   - Capability : ความสามารถข้ามโมดูล เช่น เห็นต้นทุน/ราคา/จัดการผู้ใช้
// ----------------------------------------------------------------------------

export type ModuleKey =
  | "quotation" // ใบเสนอราคา (ฝ่ายขาย)
  | "prepress" // พรีเพลส: ออกแบบ + ทำแม่พิมพ์
  | "production" // ฝ่ายผลิต: เครื่องพิมพ์
  | "postpress" // ฝ่ายหลังพิมพ์
  | "purchasing" // จัดซื้อ
  | "inventory" // คลังสินค้า
  | "costing" // บัญชีต้นทุน
  | "shipping"; // จัดส่ง

export type Capability =
  | "viewCost"
  | "viewPrice"
  | "createQuotation"
  | "manageMasterData"
  | "manageUsers";

// คงชื่อ type เดิมไว้เพื่อความเข้ากันได้กับโค้ดที่เรียก can(role, ...)
export type Permission = Capability;

export type Role =
  | "admin"
  | "management"
  | "sales"
  | "prepress"
  | "production"
  | "postpress"
  | "purchasing"
  | "inventory"
  | "costing"
  | "shipping";

interface RoleConfig {
  label: string;
  modules: ModuleKey[] | "all";
  caps: Capability[];
}

const ALL_MODULES: ModuleKey[] = [
  "quotation",
  "prepress",
  "production",
  "postpress",
  "purchasing",
  "inventory",
  "costing",
  "shipping",
];

const ROLES: Record<Role, RoleConfig> = {
  admin: {
    label: "ผู้ดูแลระบบ",
    modules: "all",
    caps: ["viewCost", "viewPrice", "createQuotation", "manageMasterData", "manageUsers"],
  },
  management: {
    label: "ผู้บริหาร",
    modules: "all",
    caps: ["viewCost", "viewPrice", "createQuotation", "manageMasterData"],
  },
  sales: {
    label: "ฝ่ายขาย",
    modules: ["quotation"],
    caps: ["viewPrice", "createQuotation"],
  },
  prepress: {
    label: "ฝ่ายพรีเพลส",
    modules: ["prepress", "quotation"],
    caps: [],
  },
  production: {
    label: "ฝ่ายผลิต",
    modules: ["production", "quotation"],
    caps: [],
  },
  postpress: {
    label: "ฝ่ายหลังพิมพ์",
    modules: ["postpress", "quotation"],
    caps: [],
  },
  purchasing: {
    label: "ฝ่ายจัดซื้อ",
    modules: ["purchasing", "inventory"],
    caps: ["viewCost", "manageMasterData"],
  },
  inventory: {
    label: "คลังสินค้า",
    modules: ["inventory"],
    caps: [],
  },
  costing: {
    label: "บัญชีต้นทุน",
    modules: ["costing", "quotation"],
    caps: ["viewCost", "viewPrice", "manageMasterData"],
  },
  shipping: {
    label: "ฝ่ายจัดส่ง",
    modules: ["shipping"],
    caps: [],
  },
};

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
  (Object.keys(ROLES) as Role[]).map((r) => [r, ROLES[r].label])
) as Record<Role, string>;

export function isRole(value: string): value is Role {
  return value in ROLES;
}

/// ความสามารถข้ามโมดูล (viewCost ฯลฯ)
export function can(role: string, capability: Capability): boolean {
  if (!isRole(role)) return false;
  return ROLES[role].caps.includes(capability);
}

/// สิทธิ์เข้าถึงโมดูลของแผนก
export function canAccessModule(role: string, moduleKey: ModuleKey): boolean {
  if (!isRole(role)) return false;
  const m = ROLES[role].modules;
  return m === "all" || m.includes(moduleKey);
}

export function accessibleModules(role: string): ModuleKey[] {
  if (!isRole(role)) return [];
  const m = ROLES[role].modules;
  return m === "all" ? [...ALL_MODULES] : m;
}

export interface SafeUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  department: string | null;
}
