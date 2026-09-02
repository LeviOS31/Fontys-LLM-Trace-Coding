import { Flex } from '@radix-ui/themes';
import type { TraceDetailView } from '../../../../shared/types/trace';
import { AssessmentCriteriaContainer } from '../../../assessmentCriteria/components/AssessmentCriteriaContainer';
import OpenCodePanel from '../../components/OpenCodePanel';

interface Props {
  trace: TraceDetailView;
  projectId: string;
  versionId: string;
}

export default function ContentSubPanel({ trace, projectId, versionId }: Props) {
  return (
    <Flex
      direction="column"
      gap="2"
      p="3"
      style={{
        background: 'var(--gray-2)',
        borderTop: '1px solid var(--gray-a4)',
      }}
    >
      <AssessmentCriteriaContainer projectId={projectId} />
      <OpenCodePanel selectedTrace={trace} projectId={projectId} versionId={versionId} />
    </Flex>
  );
}
