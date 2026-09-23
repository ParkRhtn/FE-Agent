"use client";

import { Menu } from "@base-ui/react/menu";
import { useTransition } from "react";

import { logout } from "@/app/login/actions";

const itemClass =
  "flex cursor-default rounded-md px-2.5 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-muted";

export function UserMenu({ email }: { email?: string }) {
  const [pending, startTransition] = useTransition();
  const initial = email?.[0]?.toUpperCase() ?? "?";

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="계정 메뉴"
        className="bg-primary text-primary-foreground focus-visible:ring-ring/50 data-popup-open:ring-ring/50 flex size-8 items-center justify-center rounded-full text-sm font-semibold outline-none select-none hover:opacity-90 focus-visible:ring-3 data-popup-open:ring-3"
      >
        {initial}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-hidden" sideOffset={8} align="end">
          <Menu.Popup className="bg-background min-w-52 origin-[var(--transform-origin)] rounded-lg border p-1 shadow-md outline-hidden transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="px-2.5 py-2">
              <p className="text-muted-foreground text-xs">로그인 계정</p>
              <p className="truncate text-sm font-medium">{email ?? "알 수 없음"}</p>
            </div>
            <Menu.Separator className="bg-border mx-1 my-1 h-px" />
            <Menu.Item
              className={itemClass}
              disabled={pending}
              onClick={() => startTransition(() => logout())}
            >
              {pending ? "로그아웃 중..." : "로그아웃"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
