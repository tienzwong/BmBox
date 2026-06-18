import type { SalesPoint } from "@/components/SalesChart";

const THAI_MONTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** ยอดขายรายวัน — เดือนปัจจุบัน (ถึงวันนี้) */
export function dailySalesCurrentMonth(rows: { issueDate: Date; total: number }[]): SalesPoint[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = now.getDate();
  const buckets: SalesPoint[] = [];

  for (let day = 1; day <= lastDay; day++) {
    buckets.push({ label: String(day), value: 0, count: 0 });
  }

  for (const r of rows) {
    const d = new Date(r.issueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (day >= 1 && day <= lastDay) {
        buckets[day - 1].value += r.total;
        buckets[day - 1].count += 1;
      }
    }
  }
  return buckets;
}

export function currentMonthLabel(): string {
  const now = new Date();
  return `${THAI_MONTH[now.getMonth()]} ${String((now.getFullYear() + 543) % 100).padStart(2, "0")}`;
}

export function monthlySales(rows: { issueDate: Date; total: number }[], months = 6): SalesPoint[] {
  const now = new Date();
  const buckets: SalesPoint[] = [];
  const index = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    index.set(key, buckets.length);
    buckets.push({
      label: `${THAI_MONTH[d.getMonth()]} ${String((d.getFullYear() + 543) % 100).padStart(2, "0")}`,
      value: 0,
      count: 0,
    });
  }
  for (const r of rows) {
    const d = new Date(r.issueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = index.get(key);
    if (idx != null) {
      buckets[idx].value += r.total;
      buckets[idx].count += 1;
    }
  }
  return buckets;
}

export function salesTotal(data: SalesPoint[]): number {
  return data.reduce((s, d) => s + d.value, 0);
}
