import { Box, Card, Flex, Heading } from '@radix-ui/themes';
import ObjectCounterBox from '../../../shared/components/ObjectCounterBox.tsx';
import SnapshotTreemapSection from '../../../shared/components/SnapshotTreemap.tsx';
import { useVersionStatistics } from '../hooks/useVersionStatistics.ts';
import { axialCodesToSnapshot } from '../../../shared/util/axialCodesToSnapshot.ts';

interface StatisticsOverviewCardProps {
  readonly projectId: string;
  readonly projectVersionId: string;
}

export default function StatisticsOverviewCard({
  projectId,
  projectVersionId,
}: StatisticsOverviewCardProps) {
  const { data, isLoading } = useVersionStatistics(projectId, projectVersionId);

  const largestAxialCode = data?.versionAxialCodes.reduce(
    (max, code) => (code.openCodeCount > (max?.openCodeCount ?? 0) ? code : max),
    data.versionAxialCodes[0]
  );

  const snapshot =
    data && data.versionAxialCodes.length > 0
      ? axialCodesToSnapshot(
          data.versionAxialCodes,
          'Current version',
          data.versionTraceCount,
          data.versionOpenCodeCount
        )
      : null;

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
          <Heading size="4">Statistics</Heading>
        </Flex>

        {/* Row 2: Counters */}
        <Flex direction="row" width="100%" gap="4" mb="4">
          <ObjectCounterBox
            label="Total Traces"
            value={data?.versionTraceCount ?? 0}
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Total Open codes"
            value={data?.versionOpenCodeCount ?? 0}
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Total Axial codes"
            value={data?.versionAxialCodeCount ?? 0}
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Avg open codes per axial code"
            value={
              data && data.versionAxialCodes.length > 0
                ? (
                    data.versionAxialCodes.reduce((sum, code) => sum + code.openCodeCount, 0) /
                    data.versionAxialCodes.length
                  ).toFixed(1)
                : 0
            }
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Largest Axial Code"
            value={largestAxialCode?.label ?? '—'}
            loading={isLoading}
          />
        </Flex>

        {/* Row 3: Charts */}
        {snapshot && (
          <Box
            mb="4"
            style={{
              border: '1px solid var(--gray-5)',
              borderRadius: '14px',
              backgroundColor: 'var(--gray-2)',
              padding: '14px 16px',
            }}
          >
            <SnapshotTreemapSection snapshotA={snapshot} />
          </Box>
        )}
      </Flex>
    </Card>
  );
}
