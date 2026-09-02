import { Badge, Box, Flex, Heading, ScrollArea, Text } from '@radix-ui/themes';
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
  return (
    <>
      {spans
        .sort((a, b) => a.startTimeUnixNano - b.startTimeUnixNano)
        .map((span) => (
          <Box
            key={span.traceScopeSpanId}
            style={{
              paddingLeft: `${depth * 16}px`,
            }}
          >
            <Box
              style={
                selectedSpanId
                  ? {
                      backgroundColor:
                        selectedSpanId === span.traceScopeSpanId
                          ? 'var(--accent-a3)'
                          : 'transparent',
                      borderLeft:
                        selectedSpanId === span.traceScopeSpanId
                          ? '1px solid var(--accent-9)'
                          : '1px solid transparent',
                    }
                  : {}
              }
            >
              <Badge
                radius="full"
                color={getSpanCategory(span).color}
                size="1"
                style={{
                  transform: 'scale(0.6)',
                }}
              >
                {'⠀'}
              </Badge>
              <Text size="2">{span.name}</Text>
            </Box>

            <SpanTree spans={span.children} selectedSpanId={selectedSpanId} depth={depth + 1} />
          </Box>
        ))}
    </>
  );
}

export function TraceNav({ trace, scrollSpanIndex }: Readonly<Props>) {
  return (
    <ScrollArea type="hover" scrollbars="vertical" style={{ height: '90vh' }}>
      <Flex direction="column" gap="2" p="1">
        {trace.traceScopes.map((scope) => (
          <Flex key={scope.name} direction="column" gap="1">
            <Heading as="h5" size="2">
              {scope.name}
              {scope.version && ` (${scope.version})`}
            </Heading>
            <SpanTree spans={buildSpanTree(scope.spans)} selectedSpanId={scrollSpanIndex} />
          </Flex>
        ))}
      </Flex>
    </ScrollArea>
  );
}
