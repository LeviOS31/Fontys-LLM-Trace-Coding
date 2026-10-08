import { useParams, Navigate } from 'react-router';
import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import { Gavel } from 'lucide-react';

type PageParams = {
  id: string;
  versionId: string;
};

export default function JudgePage() {
  const { id: projectId, versionId } = useParams<PageParams>();

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" gap="2">
        <Gavel size={20} />
        <Text size="6" weight="bold">
          Judge
        </Text>
      </Flex>
      <Text as="p" size="2" color="gray" ml="6" style={{ maxWidth: 720 }}>
        Judge the traces using the judge LLM with the generated judge template.
      </Text>

      <Box>
        <Heading size="3">Coming soon</Heading>
      </Box>
    </Flex>
  );
}