# BmBox ERP — สถาปัตยกรรมระบบ (สำหรับ graphify + นักพัฒนา)

> เอกสารนี้เป็น **source of truth** ของโครงสร้างโมดูล — graphify อ่านเป็น semantic corpus  
> อัปเดต graph: `npm run graphify:sync`

## ภาพรวม

BmBox ERP เป็น Next.js App Router + Prisma + SQLite แบบ **โมดูลแยกแผนก**  
งานไหลผ่าน **Job (ใบสั่งงาน)** กลาง จากใบเสนอราคา → พรีเพลส → ผลิต → หลังพิมพ์ → จัดส่ง

## โมดูลแผนก (Module Registry)

| key | path | ตาราง DB | API |
|-----|------|----------|-----|
| quotation | /quotations | Quotation, QuotationItem | /api/quotations |
| prepress | /prepress | Prepress | /api/prepress |
| production | /production | Production | /api/production |
| postpress | /postpress | Postpress | /api/postpress |
| shipping | /shipping | Shipment | /api/shipping |
| purchasing | /purchasing | PurchaseOrder | /api/purchasing |
| inventory | /inventory | InventoryItem | /api/inventory |
| costing | /costing | CostEntry | /api/costing |

ทะเบียน: `src/modules/registry.ts` · สิทธิ์: `src/lib/auth/permissions.ts`

## Job Lifecycle

```
Quotation (accepted) → POST /api/jobs หรือ accept quotation
  → Job (stage: prepress)
  → Prepress PATCH → stage production (design approved + plate done)
  → Production PATCH → stage postpress (status done)
  → Postpress PATCH → stage shipping (status done)
  → Shipping PATCH → stage done (delivered)
```

Progress UI: `src/lib/job-progress.ts` · `JobProgressBar` · `/jobs/[id]`

## Cross-cutting: JobEvent + Notification

| ชั้น | ไฟล์ | บทบาท |
|------|------|--------|
| JobEvent | `prisma/schema.prisma` · `src/lib/job-events.ts` | บันทึก timeline ทุกการเปลี่ยนสถานะ |
| Notification | `prisma/schema.prisma` · `/api/notifications` | แจ้งเตือนต่อ user · กระดิ่ง header |
| Hooks (5 จุด) | prepress, production, postpress, shipping API + jobs/accept | เรียก `on*Updated()` / `recordJobCreated()` |

แสดง timeline: `JobTimeline` บนห `/jobs/[id]`  
แสดงแจ้งเตือน: `NotificationBell` ใน `AppShell`

## Import Final Packaging

| ชั้น | ไฟล์ |
|------|------|
| Parser | `src/lib/packaging-import.ts` |
| UI import | `PackagingImport` ใน QuotationForm |
| Template PDF | `/quotations/packaging-template` |

## Auth & RBAC

- Session cookie: `src/lib/auth/session.ts`
- Middleware: `src/middleware.ts`
- Capabilities: viewCost, viewPrice, createQuotation, manageUsers

## graphify

- Output: `graphify-out/graph.json`, `graphify-out/graph.html`
- Sync to app: `npm run graphify:sync` → `public/architecture/graph.html`
- ดูในระบบ: `/settings/architecture` (admin/management)

## Deploy

`scripts/deploy.sh` · PM2 `ecosystem.config.cjs` · Nginx → port 3000
