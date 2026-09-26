/**
 * 외부 서비스가 부르는 백엔드 주소 (간편 API 호출 예시에 보여 준다).
 * 브라우저가 쓰는 BFF(/api/backend) 가 아니라 백엔드 자체 주소다. 배포하면 NEXT_PUBLIC_EXTERNAL_API_URL 로 바꾼다.
 */
export const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL ?? "http://localhost:8000";

export type Snippet = { id: "curl" | "python" | "javascript"; label: string; code: string };

export function workflowRunSnippets(workflowId: string, key = "sk-be-..."): Snippet[] {
  const url = `${EXTERNAL_API_URL}/api/v1/ext/workflows/${workflowId}/run`;
  return [
    {
      id: "curl",
      label: "curl",
      code: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "안녕하세요"}'`,
    },
    {
      id: "python",
      label: "Python",
      code: `import requests

response = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${key}"},
    json={"input": "안녕하세요"},
    timeout=300,
)
result = response.json()
print(result["output"] if result["status"] == "done" else result["error"])`,
    },
    {
      id: "javascript",
      label: "JavaScript",
      code: `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ input: "안녕하세요" }),
});
const result = await response.json();
console.log(result.status === "done" ? result.output : result.error);`,
    },
  ];
}
