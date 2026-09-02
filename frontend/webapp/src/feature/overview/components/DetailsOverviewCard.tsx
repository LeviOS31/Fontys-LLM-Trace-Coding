import { Card, Flex, Heading, Skeleton, Text } from '@radix-ui/themes';
import { useMemo } from 'react';
import { useGetProject } from '../../projects/hooks/useGetProject.ts';

interface DetailsOverviewCardProps {
  readonly projectId: string;
  readonly projectVersionId: string;
}

export default function DetailsOverviewCard({
  projectId,
  projectVersionId,
}: DetailsOverviewCardProps) {
  const { data, isLoading } = useGetProject(projectId);

  const currentVersion = useMemo(
    () => data?.versions.find((version) => version.versionId === projectVersionId),
    [data?.versions, projectVersionId]
  );

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
          <Heading size="4">Version Details</Heading>
        </Flex>

        {/* Row 2: Version */}
        <Flex direction="column" gap="0" mt="2">
          <Text as="label" size="2" weight="light">
            Project Version
          </Text>
          <Text size="3" weight="regular">
            <Skeleton loading={isLoading}>{currentVersion?.name ?? 'No version'}</Skeleton>
          </Text>
        </Flex>

        {/* Row 3: Description */}
        <Flex direction="column" gap="0" mt="2">
          <Text as="label" size="2" weight="light">
            Description
          </Text>
          <Text size="3" weight="regular">
            <Skeleton loading={isLoading}>
              {currentVersion?.description ?? 'No description'}
            </Skeleton>
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
