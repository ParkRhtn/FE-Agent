import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

/**
 * 브라우저용 클라이언트. BFF 프록시(/api/backend/*)를 거쳐 백엔드 /api/v1/* 로 전달된다.
 * 경로는 백엔드 기준(/api/v1/...)으로 쓰고, 프록시 접두사는 fetch 단계에서 바꿔준다.
 */
export const api = createClient<paths>({
  baseUrl: "",
  fetch: async (request) => {
    const url = new URL(request.url);
    url.pathname = url.pathname.replace(/^\/api\/v1\//, "/api/backend/");
    // new Request(url, request) 로 감싸면 본문이 스트림이 되어, Chrome 이 HTTP/1.1 에서 "Failed to fetch" 로 거부한다.
    const hasBody = !["GET", "HEAD"].includes(request.method);
    return fetch(url, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: request.signal,
    });
  },
});

export type Thread = components["schemas"]["ThreadRead"];
export type Models = components["schemas"]["ModelsRead"];
export type Agent = components["schemas"]["AgentRead"];
export type Tool = components["schemas"]["ToolRead"];
export type ModelOption = components["schemas"]["ModelOption"];
export type Provider = components["schemas"]["ProviderRead"];
