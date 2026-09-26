/** 대화 메시지 시각. 오늘이면 "오후 3:42", 올해면 "9월 25일 오후 3:42", 그 전이면 연도까지. */
export function messageTime(iso: string | undefined, now = new Date()): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const time = date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return time;
  const day = date.toLocaleDateString("ko-KR", {
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    month: "long",
    day: "numeric",
  });
  return `${day} ${time}`;
}

/** 마우스를 올렸을 때 보여 줄 전체 시각 */
export function fullTime(iso: string | undefined): string | undefined {
  return iso ? new Date(iso).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" }) : undefined;
}
