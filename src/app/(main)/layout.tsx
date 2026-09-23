import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { Logo } from "@/components/logo";
import { TopNav } from "@/components/top-nav";
import { UserMenu } from "@/components/user-menu";
import { backend } from "@/lib/api/server";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const { data: me } = await backend.GET("/api/v1/auth/me").catch((e: unknown) => {
    unstable_rethrow(e); // 401 → /auth/logout 리다이렉트는 그대로 전파
    return { data: undefined }; // 백엔드 다운: 메뉴는 보여서 로그아웃은 가능하게
  });

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-6 border-b px-4">
        <Link href="/workflows" aria-label="홈 (워크플로우)" className="rounded-md outline-offset-4">
          <Logo />
        </Link>
        <TopNav />
        <div className="ml-auto">
          <UserMenu email={me?.email} />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
