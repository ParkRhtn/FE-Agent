import "server-only";

import { redirect } from "next/navigation";
import createClient from "openapi-fetch";

import { getToken } from "@/lib/auth";

import type { paths } from "./schema";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/** 서버 컴포넌트에서 백엔드를 직접 호출하는 타입 안전 클라이언트. 쿠키의 JWT 를 Authorization 헤더로 붙인다. */
export const backend = createClient<paths>({ baseUrl: BACKEND_URL, cache: "no-store" });

backend.use({
  async onRequest({ request }) {
    const token = await getToken();
    if (token) request.headers.set("authorization", `Bearer ${token}`);
    return request;
  },
  onResponse({ response }) {
    // 토큰 만료/위조: 쿠키를 지우는 라우트로 보낸다 (서버 컴포넌트에서는 쿠키를 지울 수 없음).
    if (response.status === 401) redirect("/auth/logout");
    return response;
  },
});
