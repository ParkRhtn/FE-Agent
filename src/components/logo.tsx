import { cn } from "cn";

/**
 * 노드 세 개로 만든 A. 초록 선은 워크플로우를 실행했을 때 지나간 경로,
 * 속이 빈 노드는 아직 실행 전인 단계를 뜻한다. (app/icon.svg 와 같은 그림)
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-6 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill="#18181b" />
      <path
        d="M16 9.5 23 22.5M12.4 16.9h7.2"
        stroke="#fafafa"
        strokeOpacity=".6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M9 22.5 16 9.5" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="9.5" r="3" fill="#fafafa" />
      <circle cx="9" cy="22.5" r="3" fill="#34d399" />
      <circle cx="23" cy="22.5" r="2.4" fill="#18181b" stroke="#fafafa" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-[15px] font-semibold tracking-tight", className)}>
      <LogoMark />
      Agent
    </span>
  );
}
