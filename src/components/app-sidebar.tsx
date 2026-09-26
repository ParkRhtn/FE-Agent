"use client";

import { cn } from "cn";
import {
  BarChart3,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoMark } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { useStoredFlag } from "@/lib/use-stored-flag";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** 메뉴는 여기에 추가한다. 묶음 제목(title)은 펼친 상태에서만 보인다. */
const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/workflows", label: "워크플로우", icon: Workflow },
      { href: "/chat", label: "에이전트", icon: Bot },
      { href: "/usage", label: "사용량", icon: BarChart3 },
    ],
  },
];
const FOOTER_NAV: NavItem[] = [{ href: "/settings", label: "설정", icon: Settings }];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const [storedCollapsed, setStoredCollapsed] = useStoredFlag("sidebar.collapsed");
  // 워크플로우 편집기·대화 화면은 자기 패널(노드 목록, 대화 목록)이 있어 기본으로 접는다.
  // 거기서 펼친 것은 같은 영역 안에서만 유지하고, 다른 메뉴로 나가면 원래 설정으로 돌아간다.
  const compactArea = /^\/workflows\/[^/]+/.test(pathname)
    ? "workflow-editor"
    : isActive(pathname, "/chat")
      ? "chat"
      : null;
  const [expandedIn, setExpandedIn] = useState<string | null>(null);
  const [prevArea, setPrevArea] = useState(compactArea);
  if (prevArea !== compactArea) {
    setPrevArea(compactArea);
    if (compactArea !== expandedIn) setExpandedIn(null);
  }
  const collapsed = compactArea ? expandedIn !== compactArea : storedCollapsed;
  const toggle = () =>
    compactArea ? setExpandedIn(expandedIn === compactArea ? null : compactArea) : setStoredCollapsed(!storedCollapsed);

  const link = ({ href, label, icon: Icon }: NavItem) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3",
          collapsed && "justify-center px-0",
          active
            ? "bg-muted text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active && "text-foreground")} />
        {!collapsed && label}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "bg-muted/30 flex shrink-0 flex-col border-r transition-[width] duration-150",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* 접기·펼치기 버튼은 두 상태 모두 맨 위 로고 줄에 둔다 */}
      <div
        className={cn("flex h-12 shrink-0 items-center", collapsed ? "justify-center" : "justify-between pr-2 pl-3")}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="메뉴 펼치기"
            title="메뉴 펼치기"
            className="group/expand hover:bg-muted focus-visible:ring-ring/50 relative flex size-8 items-center justify-center rounded-md outline-none focus-visible:ring-3"
          >
            <LogoMark className="transition-opacity group-hover/expand:opacity-0 group-focus-visible/expand:opacity-0" />
            <PanelLeftOpen className="text-muted-foreground absolute size-4 opacity-0 transition-opacity group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100" />
          </button>
        ) : (
          <>
            <Link
              href="/workflows"
              aria-label="홈 (워크플로우)"
              className="focus-visible:ring-ring/50 flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-3"
            >
              <LogoMark />
              Agent
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label="메뉴 접기"
              title="메뉴 접기"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-2" aria-label="주 메뉴">
        {NAV.map((section, i) => (
          <div key={section.title ?? i} className="flex flex-col gap-0.5">
            {section.title && !collapsed && (
              <span className="text-muted-foreground px-2 pb-1 text-xs font-medium">{section.title}</span>
            )}
            {section.items.map(link)}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t p-2">
        {FOOTER_NAV.map(link)}
        <div className={cn("pt-1", collapsed && "flex justify-center")}>
          <UserMenu email={email} compact={collapsed} />
        </div>
      </div>
    </aside>
  );
}
