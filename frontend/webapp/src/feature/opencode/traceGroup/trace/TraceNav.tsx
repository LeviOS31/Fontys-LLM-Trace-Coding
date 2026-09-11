import { Badge, Box, Flex, Heading, ScrollArea, Text } from '@radix-ui/themes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TraceDetailView } from '../../../../shared/types/trace';
import { getSpanCategory } from './getSpanCategory';
import { buildSpanTree, type SpanNode } from './spanTree';

type Props = {
  trace: TraceDetailView;
  scrollSpanIndex: string | null;
};

type SpanTreeProps = {
  spans: SpanNode[];
  selectedSpanId: string | null;
  depth?: number;
};

function SpanTree({ spans, selectedSpanId, depth = 0 }: Readonly<SpanTreeProps>) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const visibleSpans = useMemo(
    () => [...spans].sort((a, b) => a.startTimeUnixNano - b.startTimeUnixNano),
    [spans]
  );

  return (
    <>
      {visibleSpans.map((span) => {
        const hasChildren = span.children.length > 0;
        const isSelected = selectedSpanId === span.traceScopeSpanId;
        const isCollapsed = collapsed[span.traceScopeSpanId] ?? false;

        const handleNavigate = () => {
          const target = document.querySelector(
            `[data-span-id="${span.traceScopeSpanId}"]`
          ) as HTMLElement | null;

          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        return (
          <Box key={span.traceScopeSpanId} style={{ paddingLeft: `${depth * 14}px` }}>
            <Flex
              align="center"
              gap="1"
              onClick={handleNavigate}
              style={{
                cursor: 'pointer',
                borderLeft: isSelected ? '2px solid var(--accent-9)' : '2px solid transparent',
                backgroundColor: isSelected ? 'var(--accent-a3)' : 'transparent',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    setCollapsed((prev) => ({
                      ...prev,
                      [span.traceScopeSpanId]: !isCollapsed,
                    }));
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
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
                <Box style={{ width: 16, height: 16 }} />
              )}

              <Badge
                radius="full"
                color={getSpanCategory(span).color}
                size="1"
                style={{
                  transform: 'scale(0.65)',
                  minWidth: 10,
                }}
              >
                {'⠀'}
              </Badge>

              <Text size="2" weight={isSelected ? 'bold' : 'regular'}>
                {span.name}
              </Text>
            </Flex>

            {hasChildren && !isCollapsed && (
              <SpanTree spans={span.children} selectedSpanId={selectedSpanId} depth={depth + 1} />
            )}
          </Box>
        );
      })}
    </>
  );
}

export function TraceNav({ trace, scrollSpanIndex }: Readonly<Props>) {
  const spans = useMemo(
    () => buildSpanTree(trace.traceScopes.flatMap((scope) => scope.spans)),
    [trace.traceScopes]
  );

  return (
    <Box
      asChild
      style={{
        height: '100%',
        minWidth: 0,
        borderLeft: '1px solid var(--gray-a5)',
        borderRight: '1px solid var(--gray-a5)',
        backgroundColor: 'var(--gray-a2)',
      }}
    >
      <aside aria-label="Open Code span tree">
        <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
          <Heading as="h4" size="3" style={{ padding: '10px 12px 8px' }}>
            Span tree
          </Heading>

          <ScrollArea type="hover" scrollbars="vertical" style={{ flex: 1, minHeight: 0 }}>
            <Flex direction="column" gap="2" p="2">
              <SpanTree spans={spans} selectedSpanId={scrollSpanIndex} />
            </Flex>
          </ScrollArea>
        </Flex>
      </aside>
    </Box>
  );
}
