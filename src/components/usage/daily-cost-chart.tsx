"use client";

import { cn } from "cn";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCost, formatNumber } from "@/lib/format";

type Day = { date: string; cost: number; tokens: number };

const SERIES = "#059669"; // 흰 배경 대비 3:1 이상 (dataviz 검증 통과)
const HEIGHT = 132;

function shortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

const WEEKDAYS = "일월화수목금토";

/** "9월 24일 (목)". date 는 YYYY-MM-DD (한국 날짜) */
function dateWithWeekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${shortDate(date)} (${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`;
}

/** 날마다 바닥에 점을 찍고, 비용이 있는 날만 막대를 세운다. 가장 큰 막대 위에만 금액을 적는다. */
export function DailyCostChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(...days.map((d) => d.cost), 0);
  const peak = max > 0 ? days.findIndex((d) => d.cost === max) : -1;
  const hovered = active !== null ? days[active] : null;
  const edges = new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]);
  // 칸이 넓으면(7일) 글자를 막대 가운데에 맞춘다. 좁으면(30·90일) 가장자리 글자가 넘치지 않게 안쪽으로 붙인다.
  const roomy = days.length <= 14;
  const align = (i: number) =>
    roomy || (i > 0 && i < days.length - 1) ? "center" : i === 0 ? "start" : "end";

  return (
    <div className="flex flex-col gap-2">
      {/* 위쪽 여백은 가장 큰 막대의 금액 자리 */}
      <div className="relative pt-6" style={{ height: HEIGHT + 24 }} onPointerLeave={() => setActive(null)}>
        <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        <div className="absolute inset-x-0 top-6 bottom-0 flex items-end gap-[2px]">
          {days.map((d, i) => (
            <div
              key={d.date}
              tabIndex={0}
              role="img"
              aria-label={`${shortDate(d.date)}, 비용 ${formatCost(d.cost)}, 토큰 ${formatNumber(d.tokens)}개`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="group focus-visible:ring-ring/50 relative flex h-full flex-1 items-end justify-center rounded-sm outline-none focus-visible:ring-2"
            >
              {d.cost > 0 ? (
                <div
                  className={cn(
                    "w-full max-w-5 rounded-t-[4px] transition-opacity",
                    active !== null && active !== i && "opacity-40",
                  )}
                  style={{ height: `${Math.max((d.cost / max) * 100, 2)}%`, background: SERIES }}
                />
              ) : (
                // 쓰지 않은 날도 날짜가 있다는 걸 보여 주는 점
                <div className={cn("mb-1 size-1 rounded-full", active === i ? "bg-muted-foreground" : "bg-muted-foreground/30")} />
              )}
              {i === peak && (
                <span
                  className={cn(
                    "absolute bottom-full mb-1 text-[11px] font-medium whitespace-nowrap text-foreground tabular-nums",
                    // 좁은 칸의 가장자리 막대면 금액을 안쪽으로 붙인다
                    !roomy && i > days.length * 0.85
                      ? "right-0"
                      : !roomy && i < days.length * 0.15
                        ? "left-0"
                        : "left-1/2 -translate-x-1/2",
                  )}
                >
                  {formatCost(d.cost)}
                </span>
              )}
            </div>
          ))}
        </div>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 flex-col rounded-md border bg-background px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
            style={{ left: `${Math.min(Math.max(((active! + 0.5) / days.length) * 100, 10), 90)}%` }}
          >
            <span className="text-sm font-semibold tabular-nums">{formatCost(hovered.cost)}</span>
            <span className="text-muted-foreground">
              {dateWithWeekday(hovered.date)}, 토큰 {formatNumber(hovered.tokens)}개
            </span>
          </div>
        )}
      </div>

      <div className="relative h-4 text-[11px] text-muted-foreground">
        {days.map((d, i) =>
          edges.has(i) ? (
            <span
              key={d.date}
              className={cn(
                "absolute whitespace-nowrap",
                { center: "-translate-x-1/2", start: "left-0", end: "right-0" }[align(i)],
              )}
              style={align(i) === "center" ? { left: `${((i + 0.5) / days.length) * 100}%` } : undefined}
            >
              {i === days.length - 1 ? "오늘" : shortDate(d.date)}
            </span>
          ) : null,
        )}
      </div>

      <Button
        type="button"
        onClick={() => setShowTable(!showTable)}
        aria-expanded={showTable}
        variant="link"
        size="inline"
        className="text-muted-foreground hover:text-foreground self-start text-xs font-normal"
      >
        {showTable ? "날짜별 표 닫기" : "날짜별 표로 보기"}
      </Button>
      {showTable && (
        <div className="max-h-64 overflow-y-auto border-y">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background text-xs text-muted-foreground">
              <tr>
                <th className="py-2 text-left font-medium">날짜</th>
                <th className="py-2 text-right font-medium">토큰</th>
                <th className="py-2 text-right font-medium">비용</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...days].reverse().map((d) => (
                <tr key={d.date} className="border-t">
                  <td className="py-1.5">{d.date}</td>
                  <td className="py-1.5 text-right">{formatNumber(d.tokens)}</td>
                  <td className="py-1.5 text-right">{formatCost(d.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
