import { Badge, Flex, Text, Tooltip } from '@radix-ui/themes';
import { TriangleAlert } from 'lucide-react';
import type { TraceGroupSummaryItem } from '../../../../shared/types/trace.ts';
import { formatTraceDate } from '../../../../shared/util/formatTraceDate.ts';

interface Props {
  readonly group: TraceGroupSummaryItem;
  readonly isActive: boolean;
  readonly onClick: () => void;
}

const ellipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
} as const;

export default function TraceSidebarItem({ group, isActive, onClick }: Readonly<Props>) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="trace-sidebar-item"
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'block',
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        borderBottom: '1px solid var(--gray-a4)',
        borderLeft: isActive ? '3px solid var(--accent-9)' : '3px solid transparent',
        backgroundColor: isActive ? 'var(--accent-a3)' : 'transparent',
        color: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <Text
        as="div"
        size="2"
        weight={isActive ? 'bold' : 'medium'}
        mb="1"
        style={{ ...ellipsis, width: '100%' }}
      >
        {group.groupTitle}
      </Text>

      <Flex gap="1" wrap="wrap" mb="1">
        {group.traceCount > 0 && (
          <Badge radius="full" size="1" color="green">
            {group.traceCount} Trace{group.traceCount > 1 ? 's' : ''}
          </Badge>
        )}
        {group.amountOfSpans > 0 && (
          <Badge radius="full" size="1" color="gray">
            {group.amountOfSpans} Span{group.amountOfSpans > 1 ? 's' : ''}
          </Badge>
        )}
        {group.amountOfOpenCodes > 0 && (
          <Badge radius="full" size="1" color="orange">
            {group.amountOfOpenCodes} Open code{group.amountOfOpenCodes > 1 ? 's' : ''}
          </Badge>
        )}
        {group.amountOfAxialCodes > 0 && (
          <Badge radius="full" size="1" color="purple">
            {group.amountOfAxialCodes} Axial code{group.amountOfAxialCodes > 1 ? 's' : ''}
          </Badge>
        )}
        {group.needsAxialCodeUpdate && (
          <Tooltip content="Some traces in this group were open-coded after their axial codes were generated. The axial codes may need updating.">
            <Badge radius="full" size="1" color="amber">
              <TriangleAlert size={12} />
              Needs update
            </Badge>
          </Tooltip>
        )}
      </Flex>

      <Flex justify="between" align="center" gap="2">
        <Text size="1" color="gray" style={{ ...ellipsis, fontFamily: 'monospace', flex: 1 }}>
          {group.collectionName}
        </Text>
        <Text size="1" color="gray" style={{ flexShrink: 0 }}>
          {formatTraceDate(group.collectionCreatedAt)}
        </Text>
      </Flex>
    </button>
  );
}
