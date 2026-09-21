import { Box, Flex, Text } from '@radix-ui/themes';
import { useGetProject } from '../../projects/hooks/useGetProject';
import { AssessmentCriterion } from './AssessmentCriterion.tsx';
import { CreateAssessmentCriterion } from './CreateAssessmentCriterion.tsx';

interface AssessmentCriteriaContainerProps {
  projectId: string;
}

export function AssessmentCriteriaContainer({
  projectId,
}: Readonly<AssessmentCriteriaContainerProps>) {
  const { data, isError, isLoading } = useGetProject(projectId);

  if (isError) {
    return <Text color="red">Failed to load project.</Text>;
  }

  if (isLoading) return null;

  return (
    <Flex
      direction="column"
      gap="3"
      style={{
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
        padding: '16px 12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Text
        size="1"
        weight="bold"
        color="gray"
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        Project assessment criteria
      </Text>

      {/* Criteria */}
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Flex direction="column" gap="1">
          {data?.assessmentCriteria.map((criterion) => (
            <AssessmentCriterion key={criterion.criterionId} criterion={criterion} />
          ))}
        </Flex>
      </Box>

      {/* Create criterion */}
      <Box style={{ flexShrink: 0 }}>
        <CreateAssessmentCriterion />
      </Box>
    </Flex>
  );
}
