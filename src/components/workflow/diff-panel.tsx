"use client";

import { cn } from "cn";
import { Rocket, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GraphDiff, NodeChange } from "@/lib/workflow-diff";

const CHANGE_STYLE: Record<NodeChange["change"], { label: string; badge: string }> = {
  added: { label: "추가", badge: "bg-emerald-50 text-emerald-700" },
  changed: { label: "변경", badge: "bg-amber-50 text-amber-800" },
  removed: { label: "삭제", badge: "bg-rose-50 text-rose-700" },
};

function Badge({ change }: { change: NodeChange["change"] }) {
  const style = CHANGE_STYLE[change];
  return <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", style.badge)}>{style.label}</span>;
}

/** 배포본과 편집본(저장 안 한 것 포함)의 차이. 노드 위치는 보지 않는다. */
export function DiffPanel({
  diff,
  publishedAt,
  busy,
  onRevert,
  onPublish,
  onSelect,
}: {
  diff: GraphDiff;
  publishedAt: string;
  busy: boolean;
  onRevert: () => void;
  onPublish: () => void;
  onSelect: (nodeId: string) => void;
}) {
  const when = new Date(publishedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">배포본과 비교</h3>
        <p className="text-muted-foreground text-xs">
          {when}에 배포한 버전과 지금 화면을 비교합니다. 외부 API·공개 링크는 아직 배포본으로 실행됩니다. 노드 위치는 비교하지
          않습니다.
        </p>
      </div>

      {diff.count === 0 ? (
        <p className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-sm">배포본과 같습니다.</p>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRevert} disabled={busy} className="flex-1">
              <Undo2 className="size-3.5" />
              배포본으로 되돌리기
            </Button>
            <Button size="sm" onClick={onPublish} disabled={busy} className="flex-1">
              <Rocket className="size-3.5" />
              지금 배포
            </Button>
          </div>

          {diff.nodes.length > 0 && (
            <section className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-xs font-medium">노드 {diff.nodes.length}개</h4>
              <ul className="flex flex-col gap-2">
                {diff.nodes.map((node) => (
                  <li key={node.id} className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => node.change !== "removed" && onSelect(node.id)}
                      disabled={node.change === "removed"}
                      className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left disabled:cursor-default disabled:hover:bg-transparent"
                      title={node.change === "removed" ? undefined : "캔버스에서 이 노드 선택"}
                    >
                      <Badge change={node.change} />
                      <span className="min-w-0 flex-1 truncate text-sm">{node.title}</span>
                      <code className="text-muted-foreground shrink-0 font-mono text-[11px]">{node.id}</code>
                    </button>
                    {node.fields.length > 0 && (
                      <div className="flex flex-col gap-2 border-t px-3 py-2">
                        {node.fields.map((field) => (
                          <div key={field.key} className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs">{field.label}</span>
                            <p className="rounded bg-rose-50 px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap text-rose-800 line-through decoration-rose-300">
                              {field.before}
                            </p>
                            <p className="rounded bg-emerald-50 px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap text-emerald-800">
                              {field.after}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {diff.edges.length > 0 && (
            <section className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-xs font-medium">연결 {diff.edges.length}개</h4>
              <ul className="flex flex-col gap-1">
                {diff.edges.map((edge) => (
                  <li key={edge.id} className="flex items-center gap-2 text-sm">
                    <Badge change={edge.change} />
                    <code className="font-mono text-xs">{edge.label}</code>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
