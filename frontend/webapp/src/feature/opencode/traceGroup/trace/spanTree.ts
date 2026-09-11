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

function isWorkflow(span: SpanNode): boolean {
  return span.name.toLowerCase().includes('workflow');
}

function isTask(span: SpanNode): boolean {
  return span.name.toLowerCase().includes('task');
}

function buildSemanticTree(spans: SpanNode[]): SpanNode[] {
  const nodes: SpanNode[] = spans.map((span) => ({ ...span, children: [] }));
  const workflows = nodes.filter(isWorkflow);
  const tasks = nodes.filter(isTask);
  const assigned = new Set<string>();

  for (const workflow of workflows) assigned.add(workflow.traceScopeSpanId);

  for (const task of tasks) {
    const workflow = workflows
      .filter((candidate) => candidate.startTimeUnixNano <= task.startTimeUnixNano)
      .sort((a, b) => b.startTimeUnixNano - a.startTimeUnixNano)[0];

    if (workflow) {
      workflow.children.push(task);
      assigned.add(task.traceScopeSpanId);
    }
  }

  const parents = [...tasks, ...workflows].sort(
    (a, b) => a.startTimeUnixNano - b.startTimeUnixNano
  );

  for (const span of nodes) {
    if (assigned.has(span.traceScopeSpanId)) continue;

    const parent = parents
      .filter((candidate) => candidate.startTimeUnixNano <= span.startTimeUnixNano)
      .sort((a, b) => b.startTimeUnixNano - a.startTimeUnixNano)[0];

    if (parent) {
      parent.children.push(span);
      assigned.add(span.traceScopeSpanId);
    }
  }

  if (workflows.length > 0) return workflows;
  if (tasks.length > 0) return tasks.filter((task) => !assigned.has(task.traceScopeSpanId));
  return nodes.filter((span) => !assigned.has(span.traceScopeSpanId));
}

export function buildDisplaySpanTree(spans: TraceScopeSpanView[]): SpanNode[] {
  const tree = buildSpanTree(spans);
  const flatNodes = tree.flatMap((span) => [span, ...flattenSpanTree(span.children)]);

  if (flatNodes.length > 1 && flatNodes.every((span) => span.parentId === null)) {
    return buildSemanticTree(flatNodes);
  }

  return tree;
}

export function flattenSpanTree(spans: SpanNode[]): SpanNode[] {
  return spans
    .sort((a, b) => a.startTimeUnixNano - b.startTimeUnixNano)
    .flatMap((span) => [span, ...flattenSpanTree(span.children)]);
}
