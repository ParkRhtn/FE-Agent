import { cn } from "cn";

import { formatCost } from "@/lib/format";

/**
 * 비용 숫자. LLM 비용은 아주 작아서 "$0.0000" 같은 앞자리가 길다.
 * 의미 없는 앞자리는 흐리게, 실제 값이 시작되는 자리부터 진하게 쓴다.
 */
export function CostFigure({ value, className }: { value: number; className?: string }) {
  const text = formatCost(value);
  const match = /^(\$0\.0*)(\d.*)$/.exec(text);
  return (
    <span className={cn("tabular-nums", className)} aria-label={text}>
      {match ? (
        <>
          <span className="text-zinc-300">{match[1]}</span>
          {match[2]}
        </>
      ) : (
        text
      )}
    </span>
  );
}
