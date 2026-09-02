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
    <Box>
      <Text
        size="1"
        weight="bold"
        color="gray"
        style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        Project assessment criteria
      </Text>
      <Flex direction="column" gap="1">
        {data?.assessmentCriteria.map((criterion) => (
          <AssessmentCriterion key={criterion.criterionId} criterion={criterion} />
        ))}
      </Flex>
      <CreateAssessmentCriterion />
    </Box>
  );
}
