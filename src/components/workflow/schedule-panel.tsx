"use client";

import { cn } from "cn";
import { Clock, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api, type WorkflowSchedule } from "@/lib/api/client";
import { nextRunLabel, WEEKDAY_LABELS } from "@/lib/schedule";

const PRESETS = [
  { label: "매일", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "평일", days: [0, 1, 2, 3, 4] },
  { label: "주말", days: [5, 6] },
];

const fieldClass =
  "bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3";

type Saved = { schedule: WorkflowSchedule | null; nextRunAt: string | null };

/** 정해 둔 시각(한국 시간)에 워크플로우를 자동으로 실행한다. 그래프 저장과 따로 바로 저장한다. */
export function SchedulePanel({
  workflowId,
  schedule,
  nextRunAt,
  hasTelegramNode,
  onSaved,
}: {
  workflowId: string;
  schedule: WorkflowSchedule | null;
  nextRunAt: string | null;
  hasTelegramNode: boolean;
  onSaved: (saved: Saved) => void;
}) {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);
  const [time, setTime] = useState(schedule?.time ?? "08:00");
  const [days, setDays] = useState<number[]>(schedule?.weekdays ?? [0, 1, 2, 3, 4]);
  const [input, setInput] = useState(schedule?.input ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft: WorkflowSchedule = { enabled, time, weekdays: [...days].sort(), input };
  const dirty = JSON.stringify(draft) !== JSON.stringify(schedule && { ...schedule, weekdays: [...(schedule.weekdays ?? [])] });

  const save = async (next: WorkflowSchedule | null) => {
    setPending(true);
    setError(null);
    const { data, error } = await api.PATCH("/api/v1/workflows/{workflow_id}", {
      params: { path: { workflow_id: workflowId } },
      body: { schedule: next },
    });
    setPending(false);
    if (error || !data) {
      setError("예약을 저장하지 못했습니다. 시각과 요일을 확인하세요.");
      return;
    }
    onSaved({ schedule: data.schedule ?? null, nextRunAt: data.next_run_at ?? null });
  };

  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
          <Clock className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">예약 실행</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            정한 요일·시각(한국 시간)에 자동으로 실행합니다. 결과는 기록 탭에 남습니다.
          </p>
        </div>
      </div>

      {schedule && (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            schedule.enabled && nextRunAt ? "bg-success/10 text-success-strong" : "bg-muted text-muted-foreground",
          )}
        >
          {schedule.enabled && nextRunAt ? <>다음 실행: {nextRunLabel(nextRunAt)}</> : "예약이 꺼져 있습니다."}
        </div>
      )}

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">켜기</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            enabled ? "bg-success" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-background shadow-sm transition-[left]",
              enabled ? "left-[18px]" : "left-0.5",
            )}
          />
        </button>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">시각</span>
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value.slice(0, 5))}
          className={cn(fieldClass, "tabular-nums")}
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-medium">요일</legend>
        <div className="flex gap-1">
          {WEEKDAY_LABELS.map((label, d) => (
            <button
              key={label}
              type="button"
              aria-pressed={days.includes(d)}
              onClick={() => toggleDay(d)}
              className={cn(
                "flex-1 rounded-md border py-1.5 text-sm",
                days.includes(d)
                  ? "border-success bg-success font-medium text-white"
                  : "text-muted-foreground hover:bg-muted",
                d >= 5 && !days.includes(d) && "text-destructive/70",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setDays(p.days)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded px-1.5 py-0.5 text-xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">입력</span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="예: 오늘 IT 뉴스"
          className={cn(fieldClass, "resize-y")}
        />
        <span className="text-muted-foreground text-xs">
          실행할 때마다 시작 노드에 이 글이 들어갑니다 (<code className="bg-muted rounded px-1">{"{{input}}"}</code>).
        </span>
      </label>

      {!hasTelegramNode && (
        <p className="text-muted-foreground bg-muted/60 rounded-lg p-3 text-xs leading-relaxed">
          결과를 받아 보려면 마지막에 <span className="text-foreground font-medium">도구 → 텔레그램 보내기</span> 노드를
          붙이세요. 텔레그램은 설정에서 연결합니다.
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-2">
        <Button onClick={() => save(draft)} disabled={pending || days.length === 0 || !time || (!dirty && !!schedule)}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {schedule ? "예약 저장" : "예약 만들기"}
        </Button>
        {schedule && (
          <Button variant="ghost" onClick={() => save(null)} disabled={pending} className="text-destructive">
            예약 지우기
          </Button>
        )}
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">서버가 켜져 있을 때만 실행됩니다. 1시간 넘게 놓친 실행은 건너뜁니다.</p>
    </div>
  );
}
