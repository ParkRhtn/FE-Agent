"use client";

import { cn } from "cn";
import { Check, LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { errorText, inputClass } from "@/components/settings/model-settings";
import { Button } from "@/components/ui/button";
import { api, type TelegramStatus } from "@/lib/api/client";
import { useConfirm } from "@/components/ui/confirm";

/** 텔레그램 봇 연결. 연결하면 워크플로우·에이전트의 "텔레그램 보내기" 도구가 이 채팅으로 보낸다. */
export function TelegramSettings({ status }: { status: TelegramStatus }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!status.connected);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  const act = (fn: () => Promise<string | null | undefined>) =>
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const message = await fn();
      if (message) setNotice(message);
      router.refresh();
    });

  const connect = () =>
    act(async () => {
      const { error } = await api.PUT("/api/v1/integrations/telegram", { body: { bot_token: token } });
      if (error) {
        setError(errorText(error, "연결하지 못했습니다."));
        return null;
      }
      setToken("");
      setEditing(false);
      return "연결했습니다. 텔레그램에 확인 메시지를 보냈어요.";
    });

  const sendTest = () =>
    act(async () => {
      const { error } = await api.POST("/api/v1/integrations/telegram/test");
      if (error) setError(errorText(error, "보내지 못했습니다."));
      return error ? null : "테스트 메시지를 보냈습니다. 텔레그램을 확인하세요.";
    });

  const disconnect = async () => {
    const ok = await confirm({
      title: "텔레그램 연결을 끊을까요?",
      description: "'텔레그램 보내기' 도구를 쓰는 워크플로우와 에이전트는 실패하게 됩니다.",
      confirmLabel: "연결 끊기",
      destructive: true,
    });
    if (!ok) return;
    act(async () => {
      const { error } = await api.DELETE("/api/v1/integrations/telegram");
      if (error) {
        setError(errorText(error, "연결을 끊지 못했습니다."));
        return null;
      }
      setEditing(true);
      return "연결을 끊었습니다.";
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold">텔레그램</h2>
        <p className="text-muted-foreground text-sm">
          내 봇을 연결하면 워크플로우와 에이전트가 &lsquo;텔레그램 보내기&rsquo; 도구로 결과를 나에게 보낼 수 있습니다.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border p-4">
        {status.connected && (
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <Send className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">@{status.bot_username}</span>
              <span className="text-muted-foreground truncate text-xs">
                {status.chat_name ? `${status.chat_name} 님에게 보냅니다` : "연결됨"} · 토큰 {status.token_hint}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={sendTest} disabled={pending}>
              테스트 메시지
            </Button>
          </div>
        )}

        {editing ? (
          <form
            className={cn("flex flex-col gap-3", status.connected && "border-t pt-4")}
            onSubmit={(e) => {
              e.preventDefault();
              connect();
            }}
          >
            <ol className="text-muted-foreground flex list-decimal flex-col gap-1 pl-5 text-sm marker:text-xs">
              <li>
                텔레그램에서{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-2"
                >
                  @BotFather
                </a>
                를 열고 <code className="bg-muted rounded px-1 text-xs">/newbot</code> 을 보내 봇을 만듭니다. 마지막에 토큰을
                알려 줍니다.
              </li>
              <li>방금 만든 봇을 열어 &lsquo;시작&rsquo;을 누르거나 아무 메시지나 보냅니다. 그래야 봇이 나에게 보낼 수 있습니다.</li>
              <li>받은 토큰을 아래에 붙여 넣고 연결합니다.</li>
            </ol>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">봇 토큰</span>
              <input
                type="password"
                required
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:AA…"
                className={cn(inputClass, "font-mono")}
              />
            </label>
            <div className="flex justify-end gap-2">
              {status.connected && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
                  취소
                </Button>
              )}
              <Button type="submit" disabled={pending || token.trim().length < 10}>
                {pending && <LoaderCircle className="size-4 animate-spin" />}
                {pending ? "확인 중" : "연결"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={pending}>
              토큰 바꾸기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              disabled={pending}
              className="text-destructive hover:text-destructive"
            >
              연결 끊기
            </Button>
          </div>
        )}

        {error && (
          <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">{error}</p>
        )}
        {notice && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <Check className="size-4" />
            {notice}
          </p>
        )}
      </div>
    </section>
  );
}
