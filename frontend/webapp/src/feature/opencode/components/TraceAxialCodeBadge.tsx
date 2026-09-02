import { Badge, Flex, Tooltip } from '@radix-ui/themes';
import { TriangleAlert } from 'lucide-react';
import type { TraceDetailView } from '../../../shared/types/trace';
import { useAxialCodeTraceStatus } from '../hooks/useAxialCodeTraceStatus';

type Props = {
  trace: TraceDetailView;
  projectId: string;
  versionId: string;
};

/**
 * Shows whether the given trace is part of an axial code, and warns when the trace
 * has been open-coded again since the axial codes were generated (so they may be stale).
 * Renders nothing for traces that are not linked to any axial code.
 */
export function TraceAxialCodeBadge({ trace, projectId, versionId }: Readonly<Props>) {
  const resolveStatus = useAxialCodeTraceStatus(projectId, versionId);
  const status = resolveStatus(trace);

  if (!status.hasAxialCode) return null;

  const labelSuffix = status.labels.length > 1 ? 's' : '';

  return (
    <Flex align="center" gap="2" wrap="wrap">
      <Tooltip content={`Linked axial code${labelSuffix}: ${status.labels.join(', ')}`}>
        <Badge color="purple" variant="soft" size="1">
          Axial coded
        </Badge>
      </Tooltip>

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
