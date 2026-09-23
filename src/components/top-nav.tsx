"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/workflows", label: "워크플로우" },
  { href: "/agents", label: "에이전트" },
  { href: "/chat", label: "대화" },
  { href: "/settings", label: "설정" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="주 메뉴">
      {NAV.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm transition-colors",
              active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
