import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "bmbox_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const isAuthApi = pathname.startsWith("/api/auth");
  const isLogin = pathname === "/login";

  // ตรวจแค่การมี cookie ที่ระดับ middleware (เร็ว) — การตรวจสิทธิ์จริงทำในหน้า/API
  if (!token) {
    if (isLogin || isAuthApi) return NextResponse.next();
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }

  // ล็อกอินแล้วแต่เข้าหน้า /login → เด้งกลับหน้าแรก
  if (isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
