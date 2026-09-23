import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { NewThreadButton } from "@/components/new-thread-button";
import { backend } from "@/lib/api/server";

export async function Sidebar() {
  const { data: threads, error } = await backend.GET("/api/v1/threads").catch((e: unknown) => {
    unstable_rethrow(e); // 401 → redirect 는 그대로 전파
    return { data: undefined, error: e };
  });

  return (
    <aside className="bg-background flex w-60 shrink-0 flex-col gap-2 border-r p-3">
      <NewThreadButton className="w-full" />
      <nav className="flex flex-col gap-0.5 overflow-y-auto">
        {error ? <p className="text-destructive p-2 text-xs">백엔드에 연결할 수 없습니다.</p> : null}
        {threads?.map((thread) => (
          <Link
            key={thread.id}
            href={`/chat/${thread.id}`}
            className="hover:bg-muted truncate rounded-md px-2 py-1.5 text-sm"
          >
            {thread.title ?? "새 대화"}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
