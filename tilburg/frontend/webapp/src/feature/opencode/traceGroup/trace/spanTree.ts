import type { TraceScopeSpanView } from '../../../../shared/types/trace';

export type SpanNode = TraceScopeSpanView & { children: SpanNode[] };

export function buildSpanTree(spans: TraceScopeSpanView[]): SpanNode[] {
  const spanMap = new Map<string, SpanNode>();
  for (const span of spans) {
    spanMap.set(span.traceScopeSpanId, { ...span, children: [] });
  }
  const roots: SpanNode[] = [];
  for (const node of spanMap.values()) {
    if (node.parentId && spanMap.has(node.parentId)) {
      spanMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function flattenSpanTree(spans: SpanNode[]): SpanNode[] {
  return spans
    .sort((a, b) => a.startTimeUnixNano - b.startTimeUnixNano)
    .flatMap((span) => [span, ...flattenSpanTree(span.children)]);
}
