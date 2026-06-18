const VIEWPORT_PAD = 8;

/** คำนวณ top ของ fixed flyout ให้ไม่ล้นขอบล่าง/บนของ viewport */
export function clampFlyoutTop(anchorRect: DOMRect, panelHeight: number): number {
  let top = anchorRect.top;
  const maxTop = window.innerHeight - VIEWPORT_PAD - panelHeight;
  if (top + panelHeight > window.innerHeight - VIEWPORT_PAD) {
    top = anchorRect.bottom - panelHeight;
  }
  return Math.max(VIEWPORT_PAD, Math.min(top, maxTop));
}
