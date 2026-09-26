/** 백엔드 오류 응답에서 사용자에게 보여 줄 문장. detail 이 목록이면 줄바꿈으로 잇는다. */
export function apiErrorMessage(error: unknown): string | undefined {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const lines = detail.map((d) => (typeof d === "string" ? d : (d as { msg?: string })?.msg)).filter(Boolean);
    return lines.length ? lines.join("\n") : undefined;
  }
  return undefined;
}
