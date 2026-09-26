/** 드롭다운 메뉴(@base-ui/react/menu) 공통 모양. 카드 메뉴·편집기 더보기·사용자 메뉴가 같이 쓴다. */
export const menuPopupClass =
  "bg-background min-w-40 origin-[var(--transform-origin)] rounded-lg border p-1 shadow-md outline-hidden transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0";

export const menuItemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-muted data-disabled:opacity-50";

export const menuDangerItemClass = `${menuItemClass} text-destructive data-highlighted:bg-destructive/10`;
