import { NextResponse } from "next/server";

import { TOKEN_COOKIE } from "@/lib/auth";

/** 만료/위조 토큰 정리용. 서버 컴포넌트는 쿠키를 지울 수 없어서 백엔드 401 을 받으면 여기로 보낸다. */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}
