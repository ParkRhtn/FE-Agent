import type { WorkflowSchedule } from "@/lib/api/client";

/** 0=월 … 6=일 (백엔드와 같은 순서) */
export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function weekdaysLabel(days: number[]): string {
  const key = [...days].sort().join("");
  if (key === "0123456") return "매일";
  if (key === "01234") return "평일";
  if (key === "56") return "주말";
  return days.map((d) => WEEKDAY_LABELS[d]).join("·");
}

/** "평일 08:00" */
export function scheduleLabel(schedule: WorkflowSchedule): string {
  return `${weekdaysLabel(schedule.weekdays ?? [])} ${schedule.time}`;
}

/** "9월 25일 (금) 오전 8:00" — 한국 시간 */
export function nextRunLabel(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
