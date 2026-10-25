import { Flex } from '@radix-ui/themes';
import { LayoutDashboard } from 'lucide-react';
import { Navigate, useParams } from 'react-router';
import { VersionPageHeader } from '../versions/components/VersionPageHeader.tsx';
import { useGetTraceCollections } from '../opencode/hooks/useGetTraceCollections.ts';
import CollectionList from './components/CollectionList.tsx';
import StatisticsOverviewCard from './components/StatisticsOverviewCard.tsx';
import DetailsOverviewCard from './components/DetailsOverviewCard.tsx';
import RawLLMOutputList from './components/RawLLMOutputList.tsx';
import { useGetRawLLMOutputs } from './hooks/useGetRawLLMOutputs.ts';

type OverviewPageParams = {
  id: string;
  versionId: string;
};

export default function OverviewPage() {
  const { id, versionId } = useParams<OverviewPageParams>();

  const { data: collections, isLoading: isCollectionsLoading } = useGetTraceCollections(
    id,
    versionId
  );

  const { data: rawLLMOutputs, isLoading: isRawLLMOutputsLoading } = useGetRawLLMOutputs(
    id,
    versionId
  );

  if (!versionId) return <Navigate to="/404" replace />;
  if (!id) return <Navigate to="/404" replace />;

  return (
    <Flex direction="column" gap="2">
      <VersionPageHeader title="Overview" Icon={LayoutDashboard} />

      <DetailsOverviewCard projectId={id} projectVersionId={versionId} />

      <StatisticsOverviewCard projectId={id} projectVersionId={versionId} />

      <CollectionList
        collections={collections}
        projectId={id}
        projectVersionId={versionId}
        isLoading={isCollectionsLoading}
      />

      <RawLLMOutputList
        rawLLMOutputs={rawLLMOutputs}
        projectId={id}
        projectVersionId={versionId}
        isLoading={isRawLLMOutputsLoading}
      />
    </Flex>
  );
}
