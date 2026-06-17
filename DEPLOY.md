# BmBox ERP — การติดตั้งบน VPS และการสำรองข้อมูล

ระบบเป็น Next.js (App Router) + Prisma + SQLite — รันเป็นโปรเซสเดียวบน VPS
และออกแบบเป็น **โมดูลแยกแผนก** เพื่อแก้ไขทีละส่วนได้โดยไม่กระทบกัน

## สถาปัตยกรรมแบบโมดูล

| โมดูล | โฟลเดอร์โค้ด | route | ตาราง DB ของตัวเอง |
|-------|--------------|-------|---------------------|
| ใบเสนอราคา | `src/app/quotations`, `src/components/QuotationForm.tsx` | `/quotations` | `Quotation`, `QuotationItem` |
| พรีเพลส | `src/app/prepress`, `src/app/api/prepress` | `/prepress` | `Prepress` |
| ฝ่ายผลิต | `src/app/production`, `src/app/api/production` | `/production` | `Production` |
| หลังพิมพ์ | `src/app/postpress`, `src/app/api/postpress` | `/postpress` | `Postpress` |
| จัดซื้อ | `src/app/purchasing`, `src/app/api/purchasing` | `/purchasing` | `Supplier`, `PurchaseOrder` |
| คลังสินค้า | `src/app/inventory`, `src/app/api/inventory` | `/inventory` | `InventoryItem`, `StockMove` |
| บัญชีต้นทุน | `src/app/costing`, `src/app/api/costing` | `/costing` | `CostEntry` |
| จัดส่ง | `src/app/shipping`, `src/app/api/shipping` | `/shipping` | `Shipment` |

- **ทะเบียนโมดูล**: `src/modules/registry.ts` — เพิ่ม/ปิดโมดูลและเมนูได้จากที่เดียว
- **สิทธิ์**: `src/lib/auth/permissions.ts` — แต่ละบทบาทเห็นเฉพาะโมดูลของตน และเห็นต้นทุน/ราคาตามสิทธิ์
- **ตัวเชื่อม**: ทุกแผนกทำงานบน "ใบสั่งงาน (Job)" เดียวกัน (`src/lib/jobs.ts`) งานไหลข้ามแผนกอัตโนมัติ
  พรีเพลส → ผลิต → หลังพิมพ์ → จัดส่ง

> แก้โค้ดในโฟลเดอร์โมดูลหนึ่งและตาราง DB ของโมดูลนั้นได้อิสระ ไม่กระทบโมดูลอื่น
> (แต่ละโมดูลมีตาราง 1:1 กับ Job ของตัวเอง การเพิ่มคอลัมน์จึงไม่ชนกัน)

## แผน Deploy (Ubuntu 24.04 + Git + PM2 + เข้าถึงด้วย IP)

> สเปกแนะนำ: VPS 2 vCPU / 4GB RAM / Ubuntu 24.04 LTS / region สิงคโปร์
> (Hostinger / Vultr / DigitalOcean ใช้ได้ดี — โหลดเบามากเพราะ SQLite + Node โปรเซสเดียว)

### ขั้นที่ 0 — เตรียม VPS (ทำครั้งเดียว)

```bash
# SSH เข้า VPS ในฐานะ root หรือ user ที่มี sudo
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl

# ติดตั้ง Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง PM2 ทั่วระบบ
sudo npm install -g pm2
```

### ขั้นที่ 1 — ดึงโค้ดและติดตั้ง (ทำครั้งแรก)

```bash
sudo mkdir -p /var/www && sudo chown "$USER" /var/www
git clone <repo-url> /var/www/bmbox-erp && cd /var/www/bmbox-erp

npm ci
echo 'DATABASE_URL="file:./prisma/prod.db"' > .env
npm run db:push
npm run db:seed          # ครั้งแรกเท่านั้น (สร้าง user/กระดาษ/เครื่องพิมพ์ตัวอย่าง)
npm run build
```

### ขั้นที่ 2 — เปลี่ยนรหัสผ่านเริ่มต้นทั้งหมด (สำคัญด้านความปลอดภัย)

ผู้ใช้จาก seed มีรหัส = ชื่อผู้ใช้ + `123` ต้องเปลี่ยนก่อนเปิดใช้จริง:

```bash
npm run set-password admin <รหัสผ่านใหม่ที่แข็งแรง>
npm run set-password manager <รหัสผ่านใหม่>
# ทำกับทุกบัญชีที่จะใช้จริง (sales, prepress, prod, postpress, buyer, stock, account, ship)
# บัญชีที่ไม่ใช้ ให้ปิดการใช้งานในเมนูผู้ใช้ (admin) หรือเปลี่ยนรหัสไว้
```

### ขั้นที่ 3 — รันด้วย PM2 (ใช้ ecosystem.config.cjs ในโปรเจกต์)

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # ทำตามคำสั่งที่ขึ้นมา เพื่อให้สตาร์ทเองหลัง reboot
```

### ขั้นที่ 4 — Nginx reverse proxy (พอร์ต 80 → 3000)

```bash
sudo cp deploy/nginx-bmbox.conf /etc/nginx/sites-available/bmbox.conf
sudo ln -s /etc/nginx/sites-available/bmbox.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### ขั้นที่ 5 — Firewall (เปิดเฉพาะที่จำเป็น)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
# เข้าใช้ผ่าน IP ภายในบริษัทเท่านั้น แนะนำจำกัดให้เฉพาะ IP บริษัท:
#   sudo ufw allow from <IP-บริษัท> to any port 80 proto tcp
#   แล้วลบ rule allow 80 ทั่วไปออก เพื่อกันคนนอกเข้าถึง
```

เปิดใช้งานได้ที่ `http://<vps-ip>/`

### อัปเดตเวอร์ชันครั้งต่อไป (deploy ซ้ำ)

```bash
cd /var/www/bmbox-erp && npm run deploy
# = git pull + npm ci + db:push + build + สำรอง DB + pm2 reload
```

### หมายเหตุเรื่อง HTTPS

เลือกเข้าถึงด้วย IP ตรง ๆ — ออกใบรับรอง HTTPS สาธารณะ (Let's Encrypt) กับเลข IP เปล่าไม่ได้
ทางเลือก: (1) ใช้งานหลัง firewall/VPN ภายในบริษัทแบบ HTTP, หรือ (2) ภายหลังจดโดเมน
แล้วใช้ `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx` เพื่อเปิด HTTPS อัตโนมัติ

## สำรองข้อมูลรายสัปดาห์ (กันระบบพัง)

สั่งสำรองได้ทันทีจากหน้าเว็บ (เมนู **สำรองข้อมูล** เฉพาะแอดมิน) หรือผ่าน CLI:

```bash
npm run db:backup        # สร้าง snapshot ลง ./backups/ (VACUUM INTO, เก็บ 12 ไฟล์ล่าสุด)
```

### 1) cron บน VPS — สำรองทุกวันอาทิตย์ตี 2

```cron
0 2 * * 0  cd /var/www/bmbox-erp && /usr/bin/npm run db:backup >> /var/log/bmbox-backup.log 2>&1
```

### 2) ดึงไฟล์สำรองกลับมาเก็บที่บริษัท — ทุกวันอาทิตย์ตี 3 (รันบนเครื่องที่บริษัท)

```cron
0 3 * * 0  rsync -avz -e ssh user@<vps-ip>:/var/www/bmbox-erp/backups/ /backup/bmbox/
```

> ทำให้มีสำเนาฐานข้อมูล 2 ที่เสมอ: บน VPS และในบริษัท

## กู้คืนฐานข้อมูล

```bash
cp /backup/bmbox/bmbox-YYYYMMDD-HHmmss.db /var/www/bmbox-erp/prisma/prod.db
pm2 restart bmbox
```
