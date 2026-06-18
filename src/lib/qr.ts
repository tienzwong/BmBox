import QRCode from "qrcode";

/** สร้าง QR เป็น data URL สำหรับ embed ใน `<img>` */
export async function qrDataUrl(text: string, size = 200): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1e40af", light: "#ffffff" },
  });
}
