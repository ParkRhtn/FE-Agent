"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { CopyButton } from "@/components/copy-button";
import { errorText, inputClass } from "@/components/settings/model-settings";
import { Button } from "@/components/ui/button";
import { PublishNotice } from "@/components/workflow/publish-notice";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";
import { apiErrorMessage } from "@/lib/api/errors";

type Embed = components["schemas"]["EmbedRead"];

/** 공개 링크(iframe) 설정. 로그인 없이 쓰이므로 허용 사이트·하루 횟수를 함께 정한다. */
export function EmbedSettings({
  workflowId,
  published,
  onPublished,
}: {
  workflowId: string;
  published: boolean;
  onPublished: () => void;
}) {
  const [embed, setEmbed] = useState<Embed | null | undefined>(undefined); // undefined = 불러오는 중
  const [origins, setOrigins] = useState("");
  const [dailyLimit, setDailyLimit] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  const apply = (value: Embed | null) => {
    setEmbed(value);
    setOrigins(value?.allowed_origins.join("\n") ?? "");
    setDailyLimit(value?.daily_limit ?? 100);
  };

  useEffect(() => {
    api
      .GET("/api/v1/workflows/{workflow_id}/embed", { params: { path: { workflow_id: workflowId } } })
      .then(({ data }) => apply(data ?? null));
  }, [workflowId]);

  const save = (enabled: boolean) =>
    startTransition(async () => {
      setError(null);
      const { data, error } = await api.PUT("/api/v1/workflows/{workflow_id}/embed", {
        params: { path: { workflow_id: workflowId } },
        body: {
          enabled,
          allowed_origins: origins.split(/[\s,]+/).filter(Boolean),
          daily_limit: dailyLimit,
        },
      });
      if (error || !data) {
        const detail = (error as { detail?: unknown } | undefined)?.detail;
        setError(
          Array.isArray(detail)
            ? "사이트 주소는 https://example.com 처럼 한 줄에 하나씩 적으세요."
            : errorText(error, "저장하지 못했습니다."),
        );
        return;
      }
      apply(data);
      toast.success(!embed ? "공개 링크를 만들었습니다" : enabled ? "저장했습니다" : "공개 링크를 잠시 껐습니다");
    });

  const remove = async () => {
    const ok = await confirm({
      title: "공개 링크를 없앨까요?",
      description: "붙여 둔 사이트에서 바로 안 보이게 됩니다. 다시 만들면 주소가 바뀝니다.",
      confirmLabel: "없애기",
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const { error } = await api.DELETE("/api/v1/workflows/{workflow_id}/embed", {
        params: { path: { workflow_id: workflowId } },
      });
      if (error) {
        toast.error("공개 링크를 없애지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      apply(null);
      toast.success("공개 링크를 없앴습니다");
    });
  };

  if (embed === undefined) return <p className="text-muted-foreground text-sm">불러오는 중…</p>;

  const url = embed ? `${window.location.origin}/embed/${embed.token}` : "";
  const iframe = `<iframe src="${url}" width="100%" height="480" style="border:1px solid #e4e4e7;border-radius:12px" title="AI 도우미"></iframe>`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">
        내 홈페이지나 블로그에 붙이면 방문자가 로그인 없이 이 워크플로우를 실행합니다. 비용은 내 크레딧·키로 나갑니다.
        배포본만 실행합니다.
      </p>
      {!published && <PublishNotice workflowId={workflowId} what="공개 링크를 쓸 수" onPublished={onPublished} />}

      {/* 배포 전에는 링크가 동작하지 않으므로 코드·미리 보기를 숨긴다 */}
      {published && embed && embed.enabled && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">붙여 넣을 코드</h3>
            <span className="text-muted-foreground text-xs">
              오늘 {embed.today_runs} / {embed.daily_limit}회
            </span>
            <div className="ml-auto flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              >
                <ExternalLink className="size-3.5" />
                미리 보기
              </a>
              <CopyButton text={iframe} />
            </div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
            {iframe}
          </pre>
        </section>
      )}

      <section className="flex flex-col gap-3 border-t pt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">허용할 사이트 (한 줄에 하나)</span>
          <textarea
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            rows={3}
            placeholder={"https://myshop.com\nhttps://blog.naver.com"}
            className={`${inputClass} resize-none font-mono text-xs`}
          />
          <span className="text-muted-foreground text-xs">
            비워 두면 어느 사이트에서나 뜹니다. 남의 사이트에 무단으로 붙이는 걸 막으려면 적어 두세요.
          </span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium">하루 최대 실행</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className={`${inputClass} w-28`}
          />
          <span className="text-muted-foreground text-xs">회 (한국 날짜 기준, 넘으면 다음 날까지 멈춤)</span>
        </label>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex items-center gap-2">
          {embed && (
            <Button variant="outline" size="sm" onClick={remove} disabled={pending} className="text-destructive">
              링크 없애기
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {embed?.enabled && (
              <Button variant="outline" size="sm" onClick={() => save(false)} disabled={pending}>
                잠시 끄기
              </Button>
            )}
            <Button size="sm" onClick={() => save(true)} disabled={pending}>
              {!embed ? "공개 링크 만들기" : embed.enabled ? "설정 저장" : "다시 켜기"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
