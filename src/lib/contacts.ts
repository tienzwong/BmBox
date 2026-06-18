// ประเภทรายชื่อในสมุดที่อยู่ (Address Book)

export type ContactKind = "customer" | "supplier" | "both";

export const CONTACT_KIND_LABEL: Record<ContactKind, string> = {
  customer: "ลูกค้า",
  supplier: "ผู้จำหน่าย",
  both: "ผู้จำหน่าย/ลูกค้า",
};

export const CONTACT_KIND_DOT: Record<ContactKind, string> = {
  customer: "bg-sky-400",
  supplier: "bg-amber-400",
  both: "bg-emerald-400",
};

export const CONTACT_KIND_BADGE: Record<ContactKind, string> = {
  customer: "bg-sky-50 text-sky-700",
  supplier: "bg-amber-50 text-amber-700",
  both: "bg-emerald-50 text-emerald-700",
};

export type ContactFilter = "all" | ContactKind;

export const CONTACT_FILTERS: { value: ContactFilter; label: string }[] = [
  { value: "all", label: "แสดงทั้งหมด" },
  { value: "customer", label: "ลูกค้า" },
  { value: "supplier", label: "ผู้จำหน่าย" },
  { value: "both", label: "ผู้จำหน่าย/ลูกค้า" },
];

export interface ContactRow {
  id: string; // c-1 | s-2 | b-3 (customer id for both)
  kind: ContactKind;
  name: string;
  taxId: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerId: number | null;
  supplierId: number | null;
}

export function buildContactRows(
  customers: {
    id: number;
    name: string;
    taxId: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    supplier: { id: number } | null;
  }[],
  suppliers: {
    id: number;
    name: string;
    taxId: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    customerId: number | null;
  }[]
): ContactRow[] {
  const rows: ContactRow[] = [];
  const linkedSupplierIds = new Set<number>();

  for (const c of customers) {
    if (c.supplier) {
      linkedSupplierIds.add(c.supplier.id);
      rows.push({
        id: `b-${c.id}`,
        kind: "both",
        name: c.name,
        taxId: c.taxId,
        contact: c.contact,
        phone: c.phone,
        email: c.email,
        address: c.address,
        customerId: c.id,
        supplierId: c.supplier.id,
      });
    } else {
      rows.push({
        id: `c-${c.id}`,
        kind: "customer",
        name: c.name,
        taxId: c.taxId,
        contact: c.contact,
        phone: c.phone,
        email: c.email,
        address: c.address,
        customerId: c.id,
        supplierId: null,
      });
    }
  }

  for (const s of suppliers) {
    if (linkedSupplierIds.has(s.id) || s.customerId != null) continue;
    rows.push({
      id: `s-${s.id}`,
      kind: "supplier",
      name: s.name,
      taxId: s.taxId,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      address: s.address,
      customerId: null,
      supplierId: s.id,
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name, "th"));
}

export function filterContacts(rows: ContactRow[], filter: ContactFilter): ContactRow[] {
  if (filter === "all") return rows;
  return rows.filter((r) => r.kind === filter);
}
