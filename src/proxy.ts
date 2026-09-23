import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "token";
const PUBLIC_PATHS = ["/login", "/auth/logout"];

/** 서명 검증 없이 만료 시각만 본다. 실제 검증은 백엔드가 한다 (낙관적 체크). */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp !== "number" || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const loggedIn = token !== undefined && !isExpired(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!loggedIn && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(TOKEN_COOKIE);
    return response;
  }
  if (loggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // 정적 파일과 Next 내부 경로는 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
