import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "token";
// 공개 링크(/embed)와 그 페이지가 부르는 공개 API 는 로그인 없이 쓴다
const PUBLIC_PATHS = ["/login", "/auth/logout", "/forgot-password", "/reset-password", "/embed", "/api/backend/public"];
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/** 서명 검증 없이 만료 시각만 본다. 실제 검증은 백엔드가 한다 (낙관적 체크). */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp !== "number" || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * 공개 링크 페이지를 iframe 으로 띄울 수 있는 사이트 (CSP frame-ancestors).
 * 링크에 허용 사이트를 정했으면 그 사이트만, 비워 두었으면 어디서나, 없는 링크면 아무 데도 안 된다.
 */
async function embedFrameAncestors(token: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/embeds/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!response.ok) return "'none'";
    const { allowed_origins: origins } = (await response.json()) as { allowed_origins: string[] };
    return origins.length ? ["'self'", ...origins].join(" ") : "*";
  } catch {
    return "'none'";
  }
}

function withFrameAncestors(response: NextResponse, value: string): NextResponse {
  response.headers.set("Content-Security-Policy", `frame-ancestors ${value}`);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/embed/")) {
    const token = pathname.split("/")[2] ?? "";
    return withFrameAncestors(NextResponse.next(), await embedFrameAncestors(token));
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const loggedIn = token !== undefined && !isExpired(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let response: NextResponse;
  if (!loggedIn && !isPublic) {
    if (pathname.startsWith("/api/")) {
      response = NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    } else {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname + search);
      response = NextResponse.redirect(url);
      if (token) response.cookies.delete(TOKEN_COOKIE);
    }
  } else if (loggedIn && pathname === "/login") {
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
    response = NextResponse.next();
  }
  // 공개 링크 말고는 다른 사이트의 iframe 안에 뜨지 않게 한다 (클릭재킹 방지)
  return withFrameAncestors(response, "'self'");
}

export const config = {
  // 정적 파일과 Next 내부 경로는 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
