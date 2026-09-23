"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ThreadItem = { id: string; title: string | null; updated_at: string; agent_id: string | null };

function when(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

export function ThreadList({ threads, agentNames }: { threads: ThreadItem[]; agentNames: Record<string, string> }) {
  const pathname = usePathname();
  if (threads.length === 0) {
    return <p className="text-muted-foreground px-2 py-3 text-xs">아직 대화가 없습니다.</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {threads.map((thread) => {
        const active = pathname === `/chat/${thread.id}`;
        return (
          <li key={thread.id}>
            <Link
              href={`/chat/${thread.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-baseline gap-2 rounded-md px-2 py-1.5 text-sm",
                active ? "bg-muted font-medium" : "hover:bg-muted/60",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{thread.title ?? "새 대화"}</span>
                <span className="text-muted-foreground truncate text-[11px] font-normal">
                  {(thread.agent_id && agentNames[thread.agent_id]) || "기본 에이전트"}
                </span>
              </span>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{when(thread.updated_at)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
