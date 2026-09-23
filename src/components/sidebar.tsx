import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { logout } from "@/app/login/actions";

import { NewThreadButton } from "@/components/new-thread-button";
import { backend } from "@/lib/api/server";

export async function Sidebar() {
  const [{ data: threads, error }, { data: me }] = await Promise.all([
    backend.GET("/api/v1/threads"),
    backend.GET("/api/v1/auth/me"),
  ]).catch((e: unknown) => {
    unstable_rethrow(e); // 401 → redirect 는 그대로 전파
    return [{ data: undefined, error: e }, { data: undefined }] as const;
  });

  return (
    <aside className="bg-muted/40 flex w-64 shrink-0 flex-col gap-2 border-r p-3">
      <NewThreadButton className="w-full" />
      <Link href="/agents" className="hover:bg-muted rounded-md px-2 py-1.5 text-sm font-medium">
        에이전트 관리
      </Link>
      <p className="text-muted-foreground px-2 pt-2 text-xs">대화</p>
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
      <div className="mt-auto flex items-center gap-2 border-t pt-2">
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{me?.email}</span>
        <form action={logout}>
          <button type="submit" className="text-muted-foreground hover:text-foreground text-xs hover:underline">
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
