import { Card, Flex, Heading, Skeleton, Text } from '@radix-ui/themes';
import { useGetProject } from '../hooks/useGetProject.ts';

interface Props {
  readonly projectId: string;
}

export default function ProjectDetailsCard({ projectId }: Props) {
  const { data, isLoading } = useGetProject(projectId);

  return (
    <Card size="2" style={{ width: '100%' }}>
      <Flex direction="column">
        {/* Row 1: Title */}
        <Flex
          direction={{ initial: 'column', sm: 'row' }}
          align={{ initial: 'start', sm: 'center' }}
          justify="between"
          width="100%"
          mb="2"
        >
          <Heading size="4">Details</Heading>
        </Flex>

        {/* Row 2: Project Name */}
        <Flex direction="column" gap="0" mt="2">
          <Text as="label" size="2" weight="light">
            Project Name
          </Text>
          <Text size="3" weight="regular">
            <Skeleton loading={isLoading}>{data?.name ?? 'Unnamed project'}</Skeleton>
          </Text>
        </Flex>

        {/* Row 3: Description */}
        <Flex direction="column" gap="0" mt="2">
          <Text as="label" size="2" weight="light">
            Description
          </Text>
          <Text size="3" weight="regular">
            <Skeleton loading={isLoading}>{data?.description ?? 'No description'}</Skeleton>
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
