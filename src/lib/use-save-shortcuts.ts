import { useEffect } from "react";

/**
 * 편집 화면 공통: ⌘S / Ctrl+S 로 저장하고, 저장 안 한 변경이 있으면 새로고침·탭 닫기 때 경고한다.
 * (앱 안의 링크 이동은 브라우저 경고 대상이 아니라서 막지 않는다)
 */
export function useSaveShortcuts({ dirty, canSave, onSave }: { dirty: boolean; canSave: boolean; onSave: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault(); // 브라우저의 '페이지 저장' 대신
        if (canSave) onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSave, onSave]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // 옛 브라우저용
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
