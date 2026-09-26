"use client";

import { cn } from "cn";
import { useSyncExternalStore } from "react";

import { fullTime, messageTime } from "@/lib/time";

const subscribe = () => () => {};

/**
 * 메시지 시각. 서버(운영에서는 보통 UTC)와 브라우저의 시간대가 달라 어긋나지 않도록 브라우저에서만 그린다.
 */
export function MessageTime({ iso, className }: { iso: string | undefined; className?: string }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!iso || !isClient) return null;
  const label = messageTime(iso);
  if (!label) return null;
  return (
    <time dateTime={iso} title={fullTime(iso)} className={cn("text-muted-foreground text-[11px]", className)}>
      {label}
    </time>
  );
}
