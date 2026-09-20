import { Badge, Box, Flex, Heading, ScrollArea, Text } from '@radix-ui/themes';
import {
  ChevronDown,
  ChevronRight,
  UserPen,
  ListCollapse,
  MessageCircle,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TraceDetailView } from '../../../../shared/types/trace';
import {
  buildMessageAwareSpanTree,
  type MessageSpanNode,
  type MessageTreeAnchor,
  type SpanNode,
} from './spanTree';
import { scrollSpanIntoView } from './spanScroll';

type Props = {
  /** The trace being coded. Switching traces happens in the sidebar. */
  trace: TraceDetailView;
  selectedSpanId: string | null;
  setSelectedTrace: (traceId: string) => void;
  setSelectedSpan: (spanId: string | null) => void;
  requestChatScroll: (spanId: string, role: 'user' | 'assistant') => void;
  messageAnchors: MessageTreeAnchor[];
  selectedNodeKey: string | null;
  setSelectedNodeKey: (nodeKey: string | null) => void;
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

function getTreeIcon(span: SpanNode, messageRole?: MessageSpanNode['messageRole']) {
  if (messageRole === 'user') return UserPen;
  if (messageRole === 'assistant') return MessageCircle;
  const name = span.name.toLowerCase();
  if (name.includes('chat') || name.includes('completion')) return MessageCircle;
  if (name.includes('task')) return ListCollapse;
  return Workflow;
}

type SpanTreeProps = {
  spans: SpanNode[];
  traceId: string;
  selectedSpanId: string | null;
  setSelectedSpan: (spanId: string) => void;
  setSelectedTrace: (traceId: string) => void;
  requestChatScroll: (spanId: string, role: 'user' | 'assistant') => void;
  messageAnchors: MessageTreeAnchor[];
  depth?: number;
  selectedNodeKey?: string | null;
  setSelectedNodeKey?: (nodeKey: string | null) => void;
};

// Cap indentation so deeply nested spans don't push the row width out.
const MAX_INDENT_DEPTH = 6;
const INDENT_PX = 14;

function SpanTree({
  spans,
  traceId,
  selectedSpanId,
  setSelectedSpan,
  setSelectedTrace,
  requestChatScroll,
  messageAnchors,
  depth = 0,
  selectedNodeKey,
  setSelectedNodeKey,
}: Readonly<SpanTreeProps>) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <Flex direction="column" style={{ minWidth: 0 }}>
      {(spans.some((span) => (span as MessageSpanNode).messageRole)
        ? spans
        : [...spans].sort((a, b) => a.startTimeUnixNano - b.startTimeUnixNano)
      ).map((span) => {
        const hasChildren = span.children.length > 0;
        const isCollapsed = collapsed[span.traceScopeSpanId] ?? false;
        const messageSpan = span as MessageSpanNode;
        const nodeKey = messageSpan.nodeKey ?? span.traceScopeSpanId;
        const isSelected = selectedNodeKey === nodeKey;
        const Icon = getTreeIcon(span, messageSpan.messageRole);
        const indent = Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX;

        const handleSelect = () => {
          setSelectedNodeKey?.(nodeKey);
          setSelectedSpan(span.traceScopeSpanId);
          setSelectedTrace(traceId);
          if (messageSpan.messageRole) {
            requestChatScroll(span.traceScopeSpanId, messageSpan.messageRole);
            return;
          }
          scrollSpanIntoView(span.traceScopeSpanId);
        };

        return (
          <Box
            key={`${span.traceScopeSpanId}-${messageSpan.messageRole ?? 'span'}`}
            style={{ paddingLeft: `${indent}px`, minWidth: 0 }}
          >
            <Flex
              align="center"
              gap="1"
              onClick={handleSelect}
              data-node-key={nodeKey}
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
                {messageSpan.displayName ?? span.name}
              </Text>
            </Flex>

            {hasChildren && !isCollapsed && (
              <SpanTree
                spans={span.children}
                traceId={traceId}
                selectedSpanId={selectedSpanId}
                setSelectedSpan={setSelectedSpan}
                setSelectedTrace={setSelectedTrace}
                requestChatScroll={requestChatScroll}
                messageAnchors={messageAnchors}
                depth={depth + 1}
                selectedNodeKey={selectedNodeKey}
                setSelectedNodeKey={setSelectedNodeKey}
              />
            )}
          </Box>
        );
      })}
    </Flex>
  );
}

export function TraceTreeNav({
  trace,
  selectedSpanId,
  setSelectedSpan,
  setSelectedTrace,
  requestChatScroll,
  messageAnchors,
  selectedNodeKey,
  setSelectedNodeKey,
}: Readonly<Props>) {
  useEffect(() => {
    if (!selectedNodeKey) return;

    const target = document.querySelector(
      `[data-node-key="${CSS.escape(selectedNodeKey)}"]`
    ) as HTMLElement | null;
    if (!target) return;

    const viewport = target.closest('[data-radix-scroll-area-viewport]');
    if (viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const isFullyVisible =
        targetRect.top >= viewportRect.top && targetRect.bottom <= viewportRect.bottom;
      if (isFullyVisible) return;

      viewport.scrollTo({
        top:
          viewport.scrollTop +
          targetRect.top -
          viewportRect.top -
          viewportRect.height / 2 +
          targetRect.height / 2,
        behavior: 'smooth',
      });
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedNodeKey]);

  const spans = buildMessageAwareSpanTree(
    trace.traceScopes.flatMap((scope) => scope.spans),
    messageAnchors
  );

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
          <Box px="3" pt="3" pb="2" style={{ flexShrink: 0, minWidth: 0 }}>
            <Heading
              as="h4"
              size="3"
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Trace tree
            </Heading>
            <Flex align="center" gap="2" mt="1" style={{ minWidth: 0 }}>
              <Text
                size="1"
                color="gray"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getModelName(trace)}
              </Text>
              <Badge size="1" color="gray" style={{ flexShrink: 0 }}>
                {getSpanCount(trace)} spans
              </Badge>
            </Flex>
          </Box>

          <ScrollArea type="hover" scrollbars="vertical" style={{ flex: 1, minHeight: 0 }}>
            <Flex direction="column" gap="1" p="2" style={{ minWidth: 0 }}>
              <SpanTree
                spans={spans}
                traceId={trace.traceId}
                selectedSpanId={selectedSpanId}
                setSelectedSpan={setSelectedSpan}
                setSelectedTrace={setSelectedTrace}
                requestChatScroll={requestChatScroll}
                messageAnchors={messageAnchors}
                selectedNodeKey={selectedNodeKey}
                setSelectedNodeKey={setSelectedNodeKey}
              />
            </Flex>
          </ScrollArea>
        </Flex>
      </aside>
    </Box>
  );
}
