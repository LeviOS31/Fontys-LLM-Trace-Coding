import { Badge, Box, Flex, Heading, ScrollArea, Text } from '@radix-ui/themes';
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  ListTree,
  MessageCircle,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { TraceDetailView } from '../../../../shared/types/trace';
import { useTraceGroupSummaryList } from '../../../traces/hooks/useTraceGroupSummaryList';
import { buildDisplaySpanTree, type SpanNode } from './spanTree';

type Props = {
  projectId: string;
  versionId: string;
  activeTraceGroupId: string;
  traces: TraceDetailView[];
  selectedTraceId: string | null;
  scrollTraceId: string | null;
  selectedSpanId: string | null;
  setSelectedTrace: (traceId: string) => void;
  setSelectedSpan: (spanId: string | null) => void;
};

function getModelName(trace: TraceDetailView): string {
  for (const scope of trace.traceScopes) {
    const model = scope.spans
      .flatMap((span) => span.attributes)
      .find((attribute) => attribute.key === 'gen_ai.request.model')?.value;
    if (model) return model;
  }

  return 'Unknown model';
}

function getSpanCount(trace: TraceDetailView): number {
  return trace.traceScopes.reduce((count, scope) => count + scope.spans.length, 0);
}

function getTreeIcon(span: SpanNode) {
  const name = span.name.toLowerCase();
  if (name.includes('chat') || name.includes('completion')) return MessageCircle;
  if (name.includes('task')) return ListTree;
  return Workflow;
}

type SpanTreeProps = {
  spans: SpanNode[];
  selectedSpanId: string | null;
  setSelectedSpan: (spanId: string) => void;
  depth?: number;
};

// Cap indentation so deeply nested spans don't push the row width out.
const MAX_INDENT_DEPTH = 6;
const INDENT_PX = 14;

function SpanTree({ spans, selectedSpanId, setSelectedSpan, depth = 0 }: Readonly<SpanTreeProps>) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <Flex direction="column" style={{ minWidth: 0 }}>
      {[...spans]
        .sort((a, b) => a.startTimeUnixNano - b.startTimeUnixNano)
        .map((span) => {
          const hasChildren = span.children.length > 0;
          const isCollapsed = collapsed[span.traceScopeSpanId] ?? false;
          const isSelected = selectedSpanId === span.traceScopeSpanId;
          const Icon = getTreeIcon(span);
          const indent = Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX;

          const handleSelect = () => {
            setSelectedSpan(span.traceScopeSpanId);
            const target = document.querySelector(
              `[data-span-id="${span.traceScopeSpanId}"]`
            ) as HTMLElement | null;
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          };

          return (
            <Box key={span.traceScopeSpanId} style={{ paddingLeft: `${indent}px`, minWidth: 0 }}>
              <Flex
                align="center"
                gap="1"
                onClick={handleSelect}
                style={{
                  minHeight: 24,
                  padding: '2px 6px',
                  borderLeft: isSelected ? '2px solid var(--accent-9)' : '2px solid transparent',
                  backgroundColor: isSelected ? 'var(--accent-a3)' : 'transparent',
                  cursor: 'pointer',
                  minWidth: 0,
                }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${span.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedSpan(span.traceScopeSpanId);
                      setCollapsed((previous) => ({
                        ...previous,
                        [span.traceScopeSpanId]: !isCollapsed,
                      }));
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      minWidth: 16,
                      height: 16,
                      flexShrink: 0,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--gray-11)',
                      cursor: 'pointer',
                    }}
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                ) : (
                  <Box style={{ width: 16, minWidth: 16, height: 16, flexShrink: 0 }} />
                )}
                <Icon size={13} style={{ flexShrink: 0 }} />
                <Text
                  size="1"
                  color={isSelected ? undefined : 'gray'}
                  weight={isSelected ? 'bold' : 'regular'}
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {span.name}
                </Text>
              </Flex>

              {hasChildren && !isCollapsed && (
                <SpanTree
                  spans={span.children}
                  selectedSpanId={selectedSpanId}
                  setSelectedSpan={setSelectedSpan}
                  depth={depth + 1}
                />
              )}
            </Box>
          );
        })}
    </Flex>
  );
}

export function TraceTreeNav({
  projectId,
  versionId,
  activeTraceGroupId,
  traces,
  selectedTraceId,
  scrollTraceId,
  selectedSpanId,
  setSelectedTrace,
  setSelectedSpan,
}: Readonly<Props>) {
  const navigate = useNavigate();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useTraceGroupSummaryList(
    projectId,
    versionId,
    '',
    false
  );
  const [expandedTraceIds, setExpandedTraceIds] = useState<Set<string>>(() => new Set());
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    () => new Set([activeTraceGroupId])
  );

  const groups = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (selectedTraceId) {
      setExpandedTraceIds((previous) => new Set(previous).add(selectedTraceId));
    }
  }, [selectedTraceId]);

  useEffect(() => {
    setExpandedGroupIds((previous) => new Set(previous).add(activeTraceGroupId));
  }, [activeTraceGroupId]);

  const traceNodes = traces.map((trace, index) => {
    const isActive = trace.traceId === selectedTraceId;
    const isScrolledTo = trace.traceId === scrollTraceId;
    const isExpanded = expandedTraceIds.has(trace.traceId);
    const spans = buildDisplaySpanTree(trace.traceScopes.flatMap((scope) => scope.spans));

    return (
      <Box key={trace.traceId} style={{ position: 'relative', paddingLeft: 12, minWidth: 0 }}>
        {index < traces.length - 1 && (
          <Box
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 5,
              top: 22,
              bottom: -8,
              borderLeft: '1px solid var(--gray-a6)',
            }}
          />
        )}
        <Box
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 5,
            top: 17,
            width: 8,
            borderTop: '1px solid var(--gray-a6)',
          }}
        />
        <Flex align="stretch" style={{ width: '100%', minWidth: 0 }}>
          <button
            type="button"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} Trace ${index + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              setExpandedTraceIds((previous) => {
                const next = new Set(previous);
                if (next.has(trace.traceId)) next.delete(trace.traceId);
                else next.add(trace.traceId);
                return next;
              });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              minWidth: 26,
              flexShrink: 0,
              border: 'none',
              borderLeft: isScrolledTo ? '3px solid var(--accent-9)' : '3px solid transparent',
              borderRadius: '4px 0 0 4px',
              backgroundColor: isActive ? 'var(--accent-a3)' : 'transparent',
              color: 'var(--gray-11)',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTrace(trace.traceId);
              setExpandedTraceIds((previous) => new Set(previous).add(trace.traceId));
            }}
            style={{
              position: 'relative',
              display: 'block',
              flex: 1,
              minWidth: 0,
              padding: '7px 8px',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              backgroundColor: isActive ? 'var(--accent-a3)' : 'transparent',
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Flex align="center" gap="2" mb="1" style={{ minWidth: 0 }}>
              <GitBranch size={14} color="var(--accent-9)" style={{ flexShrink: 0 }} />
              <Text
                size="2"
                weight={isActive ? 'bold' : 'regular'}
                style={{
                  minWidth: 0,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Trace {index + 1}
              </Text>
              <Badge size="1" color="gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                {getSpanCount(trace)} spans
              </Badge>
            </Flex>
            <Text
              size="1"
              color="gray"
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getModelName(trace)}
            </Text>
          </button>
        </Flex>
        {isExpanded && (
          <SpanTree
            spans={spans}
            selectedSpanId={selectedSpanId}
            setSelectedSpan={setSelectedSpan}
          />
        )}
      </Box>
    );
  });

  return (
    <Box
      asChild
      style={{
        height: '100%',
        minWidth: 0,
        overflowX: 'hidden',
        borderRight: '1px solid var(--gray-a5)',
        backgroundColor: 'var(--gray-a2)',
      }}
    >
      <aside aria-label="Trace tree">
        <Flex direction="column" style={{ height: '100%', minHeight: 0, minWidth: 0 }}>
          <Heading
            as="h4"
            size="3"
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '10px 12px 8px',
            }}
          >
            Trace tree
          </Heading>

          <ScrollArea type="hover" scrollbars="vertical" style={{ flex: 1, minHeight: 0 }}>
            <Flex direction="column" gap="1" p="2" style={{ minWidth: 0 }}>
              <Text
                size="1"
                color="gray"
                weight="bold"
                style={{
                  display: 'block',
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '4px 8px',
                  boxSizing: 'border-box',
                }}
              >
                Trace groups
              </Text>
              {groups.map((group, index) => {
                const isActiveGroup = group.traceGroupId === activeTraceGroupId;
                const isExpanded = expandedGroupIds.has(group.traceGroupId);

                return (
                  <Box
                    key={group.traceGroupId}
                    style={{ position: 'relative', paddingLeft: 12, minWidth: 0 }}
                  >
                    {index < groups.length - 1 && (
                      <Box
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          left: 5,
                          top: 22,
                          bottom: -8,
                          borderLeft: '1px solid var(--gray-a6)',
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        isActiveGroup
                          ? setExpandedGroupIds((previous) => {
                              const next = new Set(previous);
                              if (next.has(group.traceGroupId)) next.delete(group.traceGroupId);
                              else next.add(group.traceGroupId);
                              return next;
                            })
                          : navigate(
                              `/projects/${projectId}/versions/${versionId}/open-code/${group.traceGroupId}`
                            )
                      }
                      aria-expanded={isExpanded}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '7px 8px',
                        border: 'none',
                        borderLeft: isActiveGroup
                          ? '3px solid var(--accent-9)'
                          : '3px solid transparent',
                        borderRadius: 4,
                        backgroundColor: isActiveGroup ? 'var(--accent-a3)' : 'transparent',
                        color: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                        {isExpanded ? (
                          <ChevronDown size={14} style={{ flexShrink: 0 }} />
                        ) : (
                          <ChevronRight size={14} style={{ flexShrink: 0 }} />
                        )}
                        <GitBranch size={14} color="var(--accent-9)" style={{ flexShrink: 0 }} />
                        <Text
                          size="2"
                          weight={isActiveGroup ? 'bold' : 'regular'}
                          style={{
                            minWidth: 0,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {group.groupTitle || `Trace ${index + 1}`}
                        </Text>
                        <Badge size="1" color="gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          {group.traceCount}
                        </Badge>
                      </Flex>
                    </button>
                    {isActiveGroup && isExpanded && (
                      <Box style={{ marginLeft: 12, paddingLeft: 8, minWidth: 0 }}>
                        {traceNodes}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Flex>
          </ScrollArea>
        </Flex>
      </aside>
    </Box>
  );
}
