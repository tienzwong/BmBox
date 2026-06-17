// PM2 config สำหรับ BmBox ERP
// ใช้: pm2 start ecosystem.config.cjs  แล้ว  pm2 save
// SQLite รันโปรเซสเดียวเท่านั้น (instances: 1) ห้ามใช้ cluster mode
module.exports = {
  apps: [
    {
      name: "bmbox",
      cwd: "/var/www/bmbox-erp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
