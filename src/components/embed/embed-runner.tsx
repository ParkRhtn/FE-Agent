"use client";

import { cn } from "cn";
import { ArrowUp, Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

const MAX_LENGTH = 2000; // 백엔드 공개 API 와 같은 한도

type Turn = {
  id: number;
  input: string;
  status: "pending" | "done" | "error";
  output?: string | null;
  error?: string | null;
};

function Avatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-xs",
        className,
      )}
    >
      <Sparkles className="size-4" />
    </span>
  );
}

function CopyAnswer({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-muted-foreground hover:bg-muted hover:text-foreground -ml-1.5 flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-xs"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

/** 다른 웹사이트에 iframe 으로 붙는 공개 실행 화면. 입력 하나마다 워크플로우(배포본)를 한 번 실행한다. */
export function EmbedRunner({ token, name, description }: { token: string; name: string; description: string | null }) {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const busy = turns.some((t) => t.status === "pending");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const finish = (id: number, patch: Partial<Turn>) =>
    setTurns((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const id = nextId.current++;
    setTurns((all) => [...all, { id, input: text, status: "pending" }]);
    setInput("");
    try {
      const response = await fetch(`/api/backend/public/embeds/${encodeURIComponent(token)}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: text }),
      });
      const body = await response.json();
      if (!response.ok) {
        finish(id, {
          status: "error",
          error: typeof body.detail === "string" ? body.detail : "실행하지 못했습니다. 잠시 뒤에 다시 시도하세요.",
        });
      } else if (body.status === "done") {
        finish(id, { status: "done", output: body.output });
      } else {
        finish(id, { status: "error", error: body.error ?? "실행하지 못했습니다." });
      }
    } catch {
      finish(id, { status: "error", error: "연결하지 못했습니다. 네트워크를 확인하고 다시 시도하세요." });
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur">
        <Avatar className="size-9 rounded-xl [&_svg]:size-5" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-sm font-semibold">{name}</h1>
          <p className="text-muted-foreground truncate text-xs">{description || "AI 도우미"}</p>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={() => setTurns([])}
            disabled={busy}
            title="처음부터 다시"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" />
            새로 시작
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
          {turns.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Avatar className="size-12 rounded-2xl [&_svg]:size-6" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{name}</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  {description || "아래에 내용을 입력하면 바로 결과를 만들어 드립니다."}
                </p>
              </div>
            </div>
          )}

          {turns.map((turn) => (
            <div key={turn.id} className="flex flex-col gap-4">
              <div className="flex justify-end">
                <p className="bg-muted max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {turn.input}
                </p>
              </div>
              <div className="flex gap-3">
                <Avatar className="mt-0.5" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {turn.status === "pending" && (
                    <span className="text-muted-foreground flex h-7 items-center gap-1" aria-label="결과를 만드는 중">
                      <span className="size-1.5 animate-pulse rounded-full bg-current" />
                      <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                      <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                    </span>
                  )}
                  {turn.status === "done" && (
                    <>
                      <Streamdown className="text-sm leading-relaxed">{turn.output || "(결과가 비어 있습니다)"}</Streamdown>
                      {turn.output && <CopyAnswer text={turn.output} />}
                    </>
                  )}
                  {turn.status === "error" && (
                    <p className="w-fit rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{turn.error}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="mx-auto w-full max-w-2xl shrink-0 px-4 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="focus-within:border-ring focus-within:ring-ring/30 flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-sm focus-within:ring-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="메시지를 입력하세요"
            aria-label="메시지"
            rows={1}
            className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="보내기"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white transition-opacity disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="text-muted-foreground mt-1.5 flex justify-between gap-2 px-1 text-[11px]">
          <span>AI 가 만든 결과는 틀릴 수 있습니다.</span>
          {input.length > MAX_LENGTH * 0.8 ? (
            <span className="tabular-nums">
              {input.length} / {MAX_LENGTH}
            </span>
          ) : (
            <span className="hidden sm:inline">Enter 로 보내기 · Shift+Enter 줄바꿈</span>
          )}
        </p>
      </form>
    </div>
  );
}
