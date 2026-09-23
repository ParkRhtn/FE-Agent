import { BACKEND_URL } from "@/lib/api/server";
import { getToken } from "@/lib/auth";

/**
 * BFF 프록시: 브라우저 → Next.js → FastAPI.
 * 인증 토큰 주입, 요청 검증 등을 이곳에서 처리하면 백엔드 주소와 비밀값이 브라우저에 노출되지 않는다.
 */
const FORWARD_RESPONSE_HEADERS = ["content-type", "cache-control", "x-vercel-ai-ui-message-stream"];

async function proxy(request: Request, { params }: RouteContext<"/api/backend/[...path]">) {
  const { path } = await params;
  const url = new URL(`/api/v1/${path.join("/")}`, BACKEND_URL);
  url.search = new URL(request.url).search;

  const headers: Record<string, string> = {
    "content-type": request.headers.get("content-type") ?? "application/json",
  };
  const token = await getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    signal: request.signal, // 브라우저가 중단(stop)하면 백엔드 요청도 끊는다
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  // 스트리밍 응답은 body 를 그대로 흘려보낸다 (버퍼링 없음)
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
