#!/usr/bin/env bash
# Deploy / อัปเดต BmBox ERP บน VPS (ดึงโค้ดใหม่จาก Git แล้ว build + reload)
# ใช้: bash scripts/deploy.sh   (รันในโฟลเดอร์โปรเจกต์บน VPS)
set -euo pipefail

cd "$(dirname "$0")/.."
echo "==> ดึงโค้ดล่าสุด"
git pull --ff-only

echo "==> ติดตั้ง dependencies"
npm ci

echo "==> sync schema เข้า DB (ไม่ลบข้อมูล)"
npx prisma generate
npm run db:push

echo "==> seed เครื่องจักร (ถ้ายังไม่มี)"
npm run db:seed-machines 2>/dev/null || true

echo "==> build production"
npm run build

echo "==> sync graphify → public/architecture (ถ้ามี)"
npm run graphify:sync 2>/dev/null || true

echo "==> สำรองฐานข้อมูลก่อนสลับเวอร์ชัน"
npm run db:backup || true

echo "==> reload ผ่าน PM2"
if pm2 describe bmbox > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "==> เสร็จสิ้น Deploy"
