import { cn } from "cn";
import Link from "next/link";

import { CostFigure } from "@/components/usage/cost-figure";
import { DailyCostChart } from "@/components/usage/daily-cost-chart";
import { backend } from "@/lib/api/server";
import type { components } from "@/lib/api/schema";
import { formatNumber } from "@/lib/format";

type Row = components["schemas"]["UsageRow"];

const RANGES = [7, 30, 90] as const;

/** 어디에 썼나: 이름은 자르지 않고 줄바꿈한다. 비중 막대는 이 목록 안에서 가장 많이 쓴 항목 기준. */
function Breakdown({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const max = Math.max(...rows.map((r) => r.cost), 0);
  return (
    <section className="flex min-w-0 flex-col">
      <h3 className="border-b pb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.name} className="flex flex-col gap-1.5 border-b py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 text-sm font-medium break-words">{r.name}</span>
                <CostFigure value={r.cost} className="shrink-0 text-sm font-semibold" />
              </div>
              <span className="h-1 rounded-full bg-muted">
                <span
                  className="block h-1 rounded-full bg-[#059669]"
                  style={{ width: max && r.cost ? `${Math.max((r.cost / max) * 100, 1)}%` : 0 }}
                />
              </span>
              <span className="text-xs text-muted-foreground">
                호출 {formatNumber(r.calls)}번, 토큰 {formatNumber(r.tokens)}개
                {r.unpriced_calls ? `, 가격 정보 없음 ${formatNumber(r.unpriced_calls)}번` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function UsagePage({ searchParams }: PageProps<"/usage">) {
  const raw = Number((await searchParams).days);
  const days = RANGES.includes(raw as (typeof RANGES)[number]) ? raw : 30;
  const { data: usage } = await backend.GET("/api/v1/usage", { params: { query: { days } } });

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">사용량</h1>
          <nav className="flex rounded-lg bg-muted p-0.5 text-sm" aria-label="기간">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/usage?days=${r}`}
                aria-current={r === days ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1",
                  r === days ? "bg-background font-medium shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}일
              </Link>
            ))}
          </nav>
        </header>

        {!usage ? (
          <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
            사용량을 불러오지 못했습니다. 잠시 뒤에 다시 열어 보세요.
          </p>
        ) : usage.error ? (
          <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
            {usage.error}
          </p>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <CostFigure value={usage.total_cost ?? 0} className="text-5xl font-semibold tracking-tight" />
              <p className="max-w-prose text-foreground/75">
                {usage.calls ? (
                  <>
                    지난 {days}일 동안 모델을{" "}
                    <strong className="font-semibold text-foreground">{formatNumber(usage.calls)}번</strong> 불러 토큰{" "}
                    <strong className="font-semibold text-foreground">{formatNumber(usage.total_tokens ?? 0)}개</strong>를
                    썼습니다.
                  </>
                ) : (
                  <>지난 {days}일 동안 모델을 부르지 않았습니다. 대화나 워크플로우를 실행하면 여기에 쌓입니다.</>
                )}
              </p>
              <p className="text-xs text-muted-foreground/70">
                금액은 호출할 때 받은 토큰 수에 모델별 가격을 곱한 달러 값입니다.
                {usage.unpriced_calls ? (
                  <> 가격을 모르는 모델 호출 {formatNumber(usage.unpriced_calls)}번은 금액에 들어가지 않았습니다.</>
                ) : null}
              </p>
            </section>

            <section aria-label="날짜별 비용">
              <DailyCostChart days={usage.daily ?? []} />
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-base font-semibold">어디에 썼나</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <Breakdown title="모델" rows={usage.by_model ?? []} empty="이 기간에 부른 모델이 없습니다." />
                <Breakdown
                  title="워크플로우와 대화"
                  rows={usage.by_source ?? []}
                  empty="이 기간에 실행한 워크플로우나 대화가 없습니다."
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
