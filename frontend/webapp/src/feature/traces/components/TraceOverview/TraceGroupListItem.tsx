import { Badge, Box, Flex, Text, Tooltip } from '@radix-ui/themes';
import { TriangleAlert } from 'lucide-react';
import type { TraceGroupSummaryItem } from '../../../../shared/types/trace.ts';
import { formatTraceDate } from '../../../../shared/util/formatTraceDate.ts';

interface Props {
  readonly trace: TraceGroupSummaryItem;
  readonly isFocused?: boolean;
  readonly onClick: () => void;
}

export default function TraceGroupListItem({ trace, isFocused, onClick }: Props) {
  return (
    <Box
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--gray-a4)',
        padding: '14px 16px 14px 0',
        cursor: 'pointer',
        borderLeft: isFocused ? '2px solid var(--accent-9)' : '2px solid transparent',
        paddingLeft: '10px',
        background: isFocused ? 'var(--gray-a2)' : undefined,
        outline: isFocused ? '2px solid var(--accent-7)' : 'none',
        outlineOffset: -2,
        maxWidth: '100%',
      }}
    >
      {/* Top row */}
      <Flex justify="between" align="center" mb="1" style={{ maxWidth: '100%' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: 1,
          }}
        >
          {trace.groupTitle}
        </span>
        <Flex gap="2" style={{ flexShrink: 0, marginLeft: '8px' }}>
          {trace.traceCount > 0 && (
            <Badge radius="full" color="green">
              {trace.traceCount} Trace{trace.traceCount > 1 ? 's' : ''}
            </Badge>
          )}
          {trace.amountOfSpans > 0 && (
            <Badge radius="full" color="gray">
              {trace.amountOfSpans} Span{trace.amountOfSpans > 1 ? 's' : ''}
            </Badge>
          )}
          {trace.amountOfOpenCodes > 0 && (
            <Badge radius="full" color="orange">
              {trace.amountOfOpenCodes} Open code{trace.amountOfOpenCodes > 1 ? 's' : ''}
            </Badge>
          )}
          {trace.amountOfAxialCodes > 0 && (
            <Badge radius="full" color="purple">
              {trace.amountOfAxialCodes} Axial code{trace.amountOfAxialCodes > 1 ? 's' : ''}
            </Badge>
          )}
          {trace.needsAxialCodeUpdate && (
            <Tooltip content="Some traces in this group were open-coded after their axial codes were generated. The axial codes may need updating.">
              <Badge radius="full" color="amber">
                <TriangleAlert size={12} />
                Needs update
              </Badge>
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* Prompt preview */}
      <Text
        as="div"
        size="2"
        mb="1"
        style={{
          lineHeight: '1.5',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        CONTENT
      </Text>

      {/* Bottom row */}
      <Flex justify="between" align="center">
        <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
          {trace.collectionName}
        </Text>
        <Text size="1" color="gray">
          {formatTraceDate(trace.collectionCreatedAt)}
        </Text>
      </Flex>
    </Box>
  );
}
