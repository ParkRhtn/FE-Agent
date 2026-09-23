"use client";

import { cn } from "cn";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, SlidersHorizontal, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AgentSettings } from "@/components/agents/agent-settings";
import { AgentAvatar } from "@/components/chat/agent-avatar";
import { MessageView } from "@/components/chat/message";
import { ModelSelect } from "@/components/model-select";
import type { Agent, ModelOption, Tool } from "@/lib/api/client";

type ChatProps = {
  threadId: string;
  initialMessages: UIMessage[];
  initialModel: string;
  models: ModelOption[];
  agent?: Agent;
  tools: Tool[];
  /** 새로 만든 에이전트면 설정 패널을 연 채로 시작 */
  openSettings?: boolean;
};

function lastUserText(messages: UIMessage[]): string {
  const last = messages.at(-1);
  return (last?.parts ?? []).map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function Chat({ threadId, initialMessages, initialModel, models, agent, tools, openSettings }: ChatProps) {
  const [settingsOpen, setSettingsOpen] = useState(Boolean(openSettings && agent));
  const toolLabels = Object.fromEntries(tools.map((t) => [t.name, t.label]));
  const router = useRouter();
  const [input, setInput] = useState("");
  const [model, setModel] = useState(initialModel);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 대화 이력은 백엔드(LangGraph 체크포인트)가 가지고 있으므로 마지막 메시지만 보낸다.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/backend/threads/${threadId}/chat`,
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { message: lastUserText(messages), model: body?.model },
        }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => router.refresh(), // 사이드바 제목 갱신
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text }, { body: { model } });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b px-4">
        <AgentAvatar isAgent={Boolean(agent)} className="size-6 [&_svg]:size-3.5" />
        <span className="truncate text-sm font-semibold">{agent ? agent.name : "기본 에이전트"}</span>
        <span className="flex-1" />
        <ModelSelect
          id="model"
          options={models}
          value={model}
          onChange={setModel}
          disabled={busy}
          className="text-muted-foreground hover:text-foreground max-w-56 rounded-md bg-transparent px-1.5 py-1 text-xs outline-none hover:bg-muted"
        />
        {agent && (
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-pressed={settingsOpen}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
              settingsOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            에이전트 설정
          </button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <AgentAvatar isAgent={Boolean(agent)} className="size-10 [&_svg]:size-5" />
                  <p className="font-medium">{agent ? `${agent.name}에게 물어보세요` : "무엇이든 물어보세요"}</p>
                  <p className="text-muted-foreground text-sm">
                    답변은 {models.find((m) => m.id === model)?.label ?? model} 모델이 합니다.
                  </p>
                </div>
              )}
              {messages.map((message, i) => (
                <MessageView
                  key={message.id}
                  message={message}
                  isAgent={Boolean(agent)}
                  toolLabels={toolLabels}
                  done={!(busy && i === messages.length - 1)}
                />
              ))}
              {status === "submitted" && (
                <div className="flex gap-3">
                  <AgentAvatar isAgent={Boolean(agent)} />
                  <span
                    className="text-muted-foreground flex items-center gap-1 text-sm"
                    aria-label="답변을 준비하는 중"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-current" />
                    <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  </span>
                </div>
              )}
              {error && (
                <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
                  답변을 받지 못했습니다: {error.message}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <form
            className="mx-auto w-full max-w-3xl px-6 pb-5"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="focus-within:border-ring focus-within:ring-ring/30 flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-xs focus-within:ring-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={agent ? `${agent.name}에게 메시지 보내기` : "메시지 보내기"}
                aria-label="메시지"
                rows={1}
                className="field-sizing-content max-h-48 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  aria-label="답변 중지"
                  className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-full"
                >
                  <Square className="size-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="보내기"
                  className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
              )}
            </div>
            <p className="text-muted-foreground mt-1.5 text-center text-[11px]">
              Enter 로 보내고 Shift+Enter 로 줄을 바꿉니다.
            </p>
          </form>
        </div>
        {agent && settingsOpen && (
          <AgentSettings
            key={agent.updated_at}
            agent={agent}
            models={models}
            tools={tools}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
