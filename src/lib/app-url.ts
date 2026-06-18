/** URL หลักของแอป — ใช้ใน QR / ลิงก์ภายนอก */
export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://app.blessmotive.com";
  return url.replace(/\/$/, "");
}

export function jobTrackUrl(code: string): string {
  return `${getAppBaseUrl()}/track/${encodeURIComponent(code)}`;
}
