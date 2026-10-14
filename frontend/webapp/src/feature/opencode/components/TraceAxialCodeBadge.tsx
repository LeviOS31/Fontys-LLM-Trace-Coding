import { Badge, Blockquote, Flex, Popover, Text, Tooltip } from '@radix-ui/themes';
import { TriangleAlert } from 'lucide-react';
import type { TraceDetailView } from '../../../shared/types/trace';
import {
  useAxialCodeTraceStatus,
  type AxialCodeTraceReason,
} from '../hooks/useAxialCodeTraceStatus';

type Props = {
  trace: TraceDetailView;
  projectId: string;
  versionId: string;
};

function AxialCodeReason({ reason }: Readonly<{ reason: AxialCodeTraceReason }>) {
  return (
    <Flex direction="column" gap="1" data-testid="axial-code-reason">
      <Text size="2" weight="bold">
        {reason.label}
      </Text>
      {reason.inclusionCriteria && (
        <Text size="1" color="gray">
          Fits when: {reason.inclusionCriteria}
        </Text>
      )}
      {reason.quote && <Blockquote size="1">“{reason.quote}”</Blockquote>}
      {reason.justification ? (
        <Text size="2">{reason.justification}</Text>
      ) : (
        <Text size="1" color="gray">
          No justification available. Regenerate the axial codes to get one.
        </Text>
      )}
    </Flex>
  );
}

/**
 * Shows whether the given trace is part of an axial code, why it belongs to each one,
 * and warns when the trace has been open-coded again since the axial codes were
 * generated (so they may be stale). Renders nothing for traces that are not linked to
 * any axial code.
 */
export function TraceAxialCodeBadge({ trace, projectId, versionId }: Readonly<Props>) {
  const resolveStatus = useAxialCodeTraceStatus(projectId, versionId);
  const status = resolveStatus(trace);

  if (!status.hasAxialCode) return null;

  const labelSuffix = status.labels.length > 1 ? 's' : '';

  return (
    <Flex align="center" gap="2" wrap="wrap">
      <Popover.Root>
        <Popover.Trigger>
          <button
            type="button"
            aria-label={`Why this trace is in axial code${labelSuffix}: ${status.labels.join(', ')}`}
            style={{ all: 'unset', cursor: 'pointer' }}
          >
            <Badge color="purple" variant="soft" size="1">
              Axial coded
            </Badge>
          </button>
        </Popover.Trigger>
        <Popover.Content size="1" maxWidth="420px">
          <Flex direction="column" gap="3">
            <Text size="1" color="gray" weight="medium">
              Why this trace is in axial code{labelSuffix}
            </Text>
            {status.reasons.map((reason) => (
              <AxialCodeReason key={reason.label} reason={reason} />
            ))}
          </Flex>
        </Popover.Content>
      </Popover.Root>

      {status.needsUpdate && (
        <Tooltip content="This trace was open-coded after its axial codes were generated. The axial codes may need updating.">
          <Badge color="amber" variant="soft" size="1">
            <TriangleAlert size={12} />
            Needs update
          </Badge>
        </Tooltip>
      )}
    </Flex>
  );
}
