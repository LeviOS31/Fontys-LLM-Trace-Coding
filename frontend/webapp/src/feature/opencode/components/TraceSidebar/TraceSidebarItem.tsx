import type { ReactNode } from 'react';
import { Badge, Box, Flex, Text, Tooltip } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react';
import type { TraceGroupSummaryItem } from '../../../../shared/types/trace.ts';
import { formatTraceDate } from '../../../../shared/util/formatTraceDate.ts';

interface Props {
  readonly group: TraceGroupSummaryItem;
  readonly isActive: boolean;
  readonly isExpanded: boolean;
  readonly onClick: () => void;
  readonly onToggleExpand: () => void;
  readonly children?: ReactNode;
}

const ellipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
} as const;

export default function TraceSidebarItem({
  group,
  isActive,
  isExpanded,
  onClick,
  onToggleExpand,
  children,
}: Readonly<Props>) {
  const background = isActive ? 'var(--accent-a3)' : 'transparent';

  return (
    <Box
      data-testid="trace-sidebar-group"
      style={{
        borderBottom: '1px solid var(--gray-a4)',
        borderLeft: isActive ? '3px solid var(--accent-9)' : '3px solid transparent',
      }}
    >
      <Flex align="stretch">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.groupTitle}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            minWidth: 26,
            flexShrink: 0,
            border: 'none',
            backgroundColor: background,
            color: 'var(--gray-11)',
            cursor: 'pointer',
          }}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <button
          type="button"
          onClick={onClick}
          data-testid="trace-sidebar-item"
          aria-current={isActive ? 'page' : undefined}
          style={{
            display: 'block',
            flex: 1,
            minWidth: 0,
            padding: '10px 12px 10px 0',
            border: 'none',
            backgroundColor: background,
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
      </Flex>

      {isExpanded && <Box pb="2">{children}</Box>}
    </Box>
  );
}
