import { unstable_rethrow } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { backend } from "@/lib/api/server";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const { data: me } = await backend.GET("/api/v1/auth/me").catch((e: unknown) => {
    unstable_rethrow(e); // 401 → /auth/logout 리다이렉트는 그대로 전파
    return { data: undefined }; // 백엔드 다운: 메뉴는 보여서 로그아웃은 가능하게
  });

  return (
    <div className="flex h-full w-full">
      <AppSidebar email={me?.email} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
