"use client";

import { cn } from "cn";
import { Play, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { CopyButton } from "@/components/copy-button";
import { errorText } from "@/components/settings/model-settings";
import { Button } from "@/components/ui/button";
import { EmbedSettings } from "@/components/workflow/embed-settings";
import { PublishNotice } from "@/components/workflow/publish-notice";
import { api } from "@/lib/api/client";
import { type Snippet, workflowRunSnippets } from "@/lib/external-api";

type RunResult = { status: string; output?: string | null; error?: string | null; run_id?: string };

/** 외부 서비스에서 이 워크플로우를 부르는 방법 (간편 API). 호출 예시 복사와 바로 호출해 보기. */
export function ApiDialog({
  open,
  onClose,
  workflowId,
  name,
  published,
}: {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  name: string;
  published: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"api" | "embed">("api");
  // 이 창에서 바로 배포할 수 있으므로 목록에서 받은 값을 여기서 갱신한다
  const [publishedHere, setPublishedHere] = useState(false);
  const isPublished = published || publishedHere;
  const [tab, setTab] = useState<Snippet["id"]>("curl");
  const [input, setInput] = useState("안녕하세요");
  const [result, setResult] = useState<RunResult | null>(null);
  const [pending, startTransition] = useTransition();
  const snippets = workflowRunSnippets(workflowId);
  const snippet = snippets.find((s) => s.id === tab) ?? snippets[0];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 화면에서는 로그인 상태로 같은 외부 API 를 불러 본다 (키 원문 없이)
  const tryRun = () =>
    startTransition(async () => {
      setResult(null);
      const { data, error } = await api.POST("/api/v1/ext/workflows/{workflow_id}/run", {
        params: { path: { workflow_id: workflowId } },
        body: { input, stream: false },
      });
      if (error || !data) {
        const detail = (error as { detail?: unknown } | undefined)?.detail;
        setResult({
          status: "error",
          error: Array.isArray(detail) ? detail.join("\n") : errorText(error, "호출하지 못했습니다."),
        });
        return;
      }
      setResult(data as RunResult);
    });

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="bg-background m-auto flex max-h-[85vh] w-[min(760px,calc(100vw-32px))] flex-col rounded-xl border p-0 shadow-xl backdrop:bg-black/30 [&:not([open])]:hidden"
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-sm font-semibold">외부에서 쓰기 · {name}</h2>
          <div className="mt-1 flex items-center gap-1" role="tablist">
            {(
              [
                ["api", "API로 호출"],
                ["embed", "웹사이트에 붙이기"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs",
                  view === value ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
        >
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {view === "embed" ? (
          <EmbedSettings workflowId={workflowId} published={isPublished} onPublished={() => setPublishedHere(true)} />
        ) : (
          <>
          <p className="text-muted-foreground text-xs">
            다른 서비스(내 서버, 앱, 자동화 도구)에서 이 워크플로우의 <b>배포본</b>을 실행합니다. 키는{" "}
            <Link href="/settings" className="text-foreground underline underline-offset-2">
              설정 → API 키
            </Link>
            에서 만드세요.
          </p>
          {!isPublished && (
            <PublishNotice workflowId={workflowId} what="API 로 호출할 수" onPublished={() => setPublishedHere(true)} />
          )}
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-1" role="tablist">
              {snippets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === s.id}
                  onClick={() => setTab(s.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs",
                    tab === s.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
              <div className="ml-auto">
                <CopyButton text={snippet.code} />
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground">
              {snippet.code}
            </pre>
            <p className="text-muted-foreground text-xs">
              <code className="font-mono">sk-be-...</code> 를 내 키로 바꾸세요. 응답:{" "}
              <code className="font-mono">{`{"run_id", "status": "done" | "error", "output", "error"}`}</code> · 노드별
              진행을 실시간으로 받으려면 <code className="font-mono">{`"stream": true`}</code>
            </p>
          </section>

          <section className="flex flex-col gap-2 border-t pt-4">
            <h3 className="text-sm font-medium">바로 호출해 보기</h3>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                tryRun();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="input"
                className="bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
              />
              <Button type="submit" size="sm" disabled={pending}>
                <Play className="size-3.5" />
                {pending ? "실행 중…" : "호출"}
              </Button>
            </form>
            {result && (
              <pre
                className={cn(
                  "overflow-x-auto rounded-lg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap",
                  result.status === "done" ? "bg-success/10 text-success-strong" : "bg-destructive/5 text-destructive",
                )}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </section>
          </>
        )}
      </div>
    </dialog>
  );
}
