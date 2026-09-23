import { NODE_META, type NodeKind, type WorkflowGraph } from "@/lib/workflow";

// 캔버스의 노드 크기와 같은 비율로 그린다 (조건 노드는 참/거짓 줄만큼 더 길다)
const NODE_W = 240;
const NODE_H = 84;
const CONDITION_H = 120;

function nodeHeight(type: string) {
  return type === "condition" ? CONDITION_H : NODE_H;
}

/** 워크플로우 노드 배치를 그대로 축소한 미리보기. 글자 대신 막대로 내용을 암시한다. */
export function WorkflowThumbnail({ graph }: { graph: WorkflowGraph }) {
  if (graph.nodes.length === 0) return null;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const xs = graph.nodes.flatMap((n) => [n.position.x, n.position.x + NODE_W]);
  const ys = graph.nodes.flatMap((n) => [n.position.y, n.position.y + nodeHeight(n.type)]);
  const pad = 60;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(...xs) - minX + pad;
  const height = Math.max(...ys) - minY + pad;

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="size-full" aria-hidden="true">
      {graph.edges.map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) return null;
        const sx = source.position.x + NODE_W;
        const branchY = edge.sourceHandle === "true" ? 0.66 : edge.sourceHandle === "false" ? 0.86 : 0.5;
        const sy = source.position.y + nodeHeight(source.type) * branchY;
        const tx = target.position.x;
        const ty = target.position.y + nodeHeight(target.type) / 2;
        const bend = Math.max(40, (tx - sx) / 2);
        return (
          <path
            key={edge.id}
            d={`M${sx},${sy} C${sx + bend},${sy} ${tx - bend},${ty} ${tx},${ty}`}
            fill="none"
            stroke={edge.sourceHandle === "false" ? "#fda4af" : edge.sourceHandle === "true" ? "#6ee7b7" : "#a1a1aa"}
            strokeWidth={5}
          />
        );
      })}
      {graph.nodes.map((node) => {
        const meta = NODE_META[node.type as NodeKind];
        const { x, y } = node.position;
        const h = nodeHeight(node.type);
        return (
          <g key={node.id}>
            <rect x={x} y={y} width={NODE_W} height={h} rx={20} fill="#fff" stroke="#e4e4e7" strokeWidth={4} />
            <rect x={x + 18} y={y + 18} width={40} height={40} rx={11} fill={meta.accent} fillOpacity={0.16} />
            <circle cx={x + 38} cy={y + 38} r={9} fill={meta.accent} />
            <rect x={x + 74} y={y + 24} width={96} height={12} rx={6} fill="#a1a1aa" />
            <rect x={x + 74} y={y + 44} width={60} height={9} rx={4.5} fill="#d4d4d8" />
            <rect x={x + 18} y={y + 62} width={170} height={9} rx={4.5} fill="#e4e4e7" />
          </g>
        );
      })}
    </svg>
  );
}
