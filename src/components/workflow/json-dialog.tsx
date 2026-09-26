"use client";

import { Check, Copy, Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

/** 워크플로우가 저장되는 모양(JSON)을 확인용으로 보여 준다. 복사·다운로드만 되고 고칠 수는 없다. */
export function JsonDialog({
  open,
  onClose,
  name,
  json,
  dirty,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  json: string;
  dirty: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // 바깥(배경)을 누르면 닫는다
      className="bg-background m-auto flex max-h-[85vh] w-[min(760px,calc(100vw-32px))] flex-col rounded-xl border p-0 shadow-xl backdrop:bg-black/30 [&:not([open])]:hidden"
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-sm font-semibold">워크플로우 JSON</h2>
          <p className="text-muted-foreground text-xs">
            {dirty ? "저장하지 않은 변경까지 포함한 지금 모습입니다." : "저장된 모습과 같습니다."} 실행할 때 서버가 이 JSON 을
            LangGraph 로 바꿉니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "복사됨" : "복사"}
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          <Download className="size-3.5" />
          다운로드
        </Button>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5"
        >
          <X className="size-4" />
        </button>
      </header>
      <pre className="min-h-0 flex-1 overflow-auto bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800">
        {json}
      </pre>
    </dialog>
  );
}
