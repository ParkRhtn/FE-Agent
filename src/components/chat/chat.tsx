"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MessageView } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatProps = {
  threadId: string;
  initialMessages: UIMessage[];
  initialModel: string;
  models: string[];
  agent?: { id: string; name: string };
};

function lastUserText(messages: UIMessage[]): string {
  const last = messages.at(-1);
  return (last?.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function Chat({ threadId, initialMessages, initialModel, models, agent }: ChatProps) {
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
    <div className="flex h-full flex-col">
      <header className="flex min-h-12 items-center gap-2 border-b px-4 py-2">
        {agent ? (
          <Link href={`/agents/${agent.id}`} className="text-sm font-medium hover:underline">
            {agent.name}
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">기본 에이전트</span>
        )}
        <span className="flex-1" />
        <label htmlFor="model" className="text-muted-foreground text-xs">
          모델
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={busy}
          className="bg-background rounded-md border px-2 py-1 text-sm"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
          {messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))}
          {status === "submitted" && <p className="text-muted-foreground text-sm">생각하는 중...</p>}
          {error && (
            <p className="text-destructive rounded-md border border-current/20 p-3 text-sm">
              오류가 발생했습니다: {error.message}
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="메시지를 입력하세요 (Shift+Enter 줄바꿈)"
          rows={2}
          className="min-h-12 resize-none"
        />
        {busy ? (
          <Button type="button" variant="outline" onClick={() => stop()}>
            중지
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()}>
            전송
          </Button>
        )}
      </form>
    </div>
  );
}
