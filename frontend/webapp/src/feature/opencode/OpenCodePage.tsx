import { Flex, Text } from '@radix-ui/themes';
import { LayoutDashboard } from 'lucide-react';
import TraceGroupMasterOverviewCard from './components/TraceGroupMasterOverviewCard.tsx';
import { Navigate, useParams } from 'react-router';

type OverviewPageParams = {
  id: string;
  versionId: string;
};

export default function OpenCodePage() {
  const { id: projectId, versionId } = useParams<OverviewPageParams>();

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <LayoutDashboard size={20} />
        <Text size="6" weight="bold">
          Open coding
        </Text>
      </Flex>
      <Text color="gray" size="2"></Text>

      <TraceGroupMasterOverviewCard projectId={projectId} projectVersionId={versionId} />
    </Flex>
  );
}
