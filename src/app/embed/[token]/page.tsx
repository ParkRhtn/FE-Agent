import type { Metadata } from "next";

import { EmbedRunner } from "@/components/embed/embed-runner";
import { BACKEND_URL } from "@/lib/api/server";

type EmbedInfo = { name: string; description: string | null };

async function loadEmbed(token: string): Promise<EmbedInfo | null> {
  // 로그인과 무관한 공개 정보라 토큰을 붙이지 않고 직접 부른다
  const response = await fetch(`${BACKEND_URL}/api/v1/public/embeds/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  return response.ok ? ((await response.json()) as EmbedInfo) : null;
}

export async function generateMetadata({ params }: PageProps<"/embed/[token]">): Promise<Metadata> {
  const embed = await loadEmbed((await params).token);
  return { title: embed?.name ?? "링크를 찾을 수 없습니다", robots: { index: false } };
}

/** 다른 웹사이트에 iframe 으로 붙이는 공개 실행 화면. 로그인 없이 쓴다. */
export default async function EmbedPage({ params }: PageProps<"/embed/[token]">) {
  const { token } = await params;
  const embed = await loadEmbed(token);
  if (!embed) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <p className="text-sm font-medium">링크를 찾을 수 없습니다</p>
        <p className="text-muted-foreground max-w-xs text-xs">
          주소가 바뀌었거나 지금은 사용할 수 없는 링크입니다. 링크를 알려 준 곳에 문의하세요.
        </p>
      </main>
    );
  }
  return <EmbedRunner token={token} name={embed.name} description={embed.description} />;
}
