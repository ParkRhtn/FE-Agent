import "server-only";

import { cookies } from "next/headers";

/** JWT 를 담는 httpOnly 쿠키. 브라우저 JS 에서는 읽을 수 없고, BFF 가 백엔드 호출 시 헤더로 옮긴다. */
export const TOKEN_COOKIE = "token";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function setToken(token: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearToken(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
}
