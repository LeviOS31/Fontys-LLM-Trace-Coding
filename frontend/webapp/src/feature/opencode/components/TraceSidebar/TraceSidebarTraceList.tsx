import { Badge, Box, Flex, Spinner, Text } from '@radix-ui/themes';
import { ListCollapse } from 'lucide-react';
import type { TraceDetailView } from '../../../../shared/types/trace.ts';
import { useTraceGroup } from '../../../traces/hooks/useTraceGroup.ts';

interface Props {
  readonly projectId: string;
  readonly projectVersionId: string;
  readonly traceGroupId: string;
  readonly activeTraceId: string | null;
  readonly isActiveGroup: boolean;
  readonly onSelectTrace: (traceId: string) => void;
}

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

/**
 * Traces of one group, rendered only while the group is expanded — mounting is
 * what triggers the fetch. The query key is shared with the trace group page,
 * so expanding the group that is already open costs no extra request.
 */
export default function TraceSidebarTraceList({
  projectId,
  projectVersionId,
  traceGroupId,
  activeTraceId,
  isActiveGroup,
  onSelectTrace,
}: Readonly<Props>) {
  const { data, isLoading, isError } = useTraceGroup(projectId, traceGroupId, projectVersionId);

  if (isLoading) {
    return (
      <Flex align="center" gap="2" px="3" py="2">
        <Spinner size="1" />
        <Text size="1" color="gray">
          Loading traces…
        </Text>
      </Flex>
    );
  }

  if (isError) {
    return (
      <Box px="3" py="2">
        <Text as="div" size="1" color="red">
          Failed to load traces.
        </Text>
      </Box>
    );
  }

  const traces = data?.traces ?? [];

  if (traces.length === 0) {
    return (
      <Box px="3" py="2">
        <Text as="div" size="1" color="gray">
          No traces in this group.
        </Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" role="group" aria-label="Traces of the group">
      {traces.map((trace, index) => {
        // A trace is only the selected one within the group that is open; the
        // group page falls back to its first trace when none is named.
        const isSelected =
          isActiveGroup && (activeTraceId ? trace.traceId === activeTraceId : index === 0);

        return (
          <button
            key={trace.traceId}
            type="button"
            data-testid="trace-sidebar-trace"
            aria-current={isSelected ? 'true' : undefined}
            onClick={() => onSelectTrace(trace.traceId)}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px 6px 28px',
              border: 'none',
              borderLeft: isSelected ? '3px solid var(--accent-9)' : '3px solid transparent',
              backgroundColor: isSelected ? 'var(--accent-a2)' : 'transparent',
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Flex align="center" gap="2" style={{ minWidth: 0 }}>
              <ListCollapse size={13} color="var(--accent-9)" style={{ flexShrink: 0 }} />
              <Text
                size="1"
                weight={isSelected ? 'bold' : 'regular'}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Trace {index + 1}
              </Text>
              {trace.openCode && (
                <Badge size="1" radius="full" color="orange" style={{ flexShrink: 0 }}>
                  Coded
                </Badge>
              )}
              <Badge size="1" color="gray" style={{ flexShrink: 0 }}>
                {getSpanCount(trace)}
              </Badge>
            </Flex>
            <Box pl="5">
              <Text
                as="div"
                size="1"
                color="gray"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {getModelName(trace)}
              </Text>
            </Box>
          </button>
        );
      })}
    </Flex>
  );
}
