import { cn } from "cn";
import { Bot } from "lucide-react";

import { LogoMark } from "@/components/logo";

/** 대화 상대 표시. 만든 에이전트는 하늘색 로봇(캔버스의 에이전트 노드와 같은 색), 기본 에이전트는 앱 로고. */
export function AgentAvatar({ isAgent, className }: { isAgent: boolean; className?: string }) {
  return isAgent ? (
    <span
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600", className)}
    >
      <Bot className="size-4" />
    </span>
  ) : (
    <LogoMark className={cn("size-7", className)} />
  );
}
