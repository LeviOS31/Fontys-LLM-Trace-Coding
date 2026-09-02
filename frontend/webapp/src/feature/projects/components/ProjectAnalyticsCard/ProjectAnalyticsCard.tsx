import { Box, Card, Flex, Heading } from '@radix-ui/themes';
import ObjectCounterBox from '../../../../shared/components/ObjectCounterBox.tsx';
import SnapshotTreemapSection from '../../../../shared/components/SnapshotTreemap.tsx';
import { useGetProject } from '../../hooks/useGetProject.ts';
import BarChartStat from './Components/BarChartStats.tsx';
import { useProjectStatistics } from '../../hooks/useProjectStatistics.ts';
import { axialCodesToSnapshot } from '../../../../shared/util/axialCodesToSnapshot.ts';

interface ProjectAnalyticsCardProps {
  readonly projectId: string;
}

export default function ProjectAnalyticsCard({ projectId }: ProjectAnalyticsCardProps) {
  const { data: project, isLoading: isProjectLoading } = useGetProject(projectId);
  const { data: stats, isLoading: isStatsLoading } = useProjectStatistics(projectId);

  const isLoading = isProjectLoading || isStatsLoading;

  const projectVersionCount = project?.versions?.length ?? 0;

  const traceTotalPerVersionChartData = Object.entries(stats?.versionTotalTraceCount ?? {}).map(
    ([name, count]) => ({ key: name, value: count })
  );

  const allAxialCodes = Object.values(stats?.versionAxialCodes ?? {}).flat();
  const largestAxialCode = allAxialCodes.reduce(
    (max, code) => (code.openCodeCount > (max?.openCodeCount ?? 0) ? code : max),
    allAxialCodes[0]
  );

  const latestVersionWithCodes = project?.versions
    .slice()
    .reverse()
    .find((v) => (stats?.versionAxialCodes[v.name] ?? []).length > 0);
  const latestVersionAxialCodes =
    latestVersionWithCodes && stats
      ? (stats.versionAxialCodes[latestVersionWithCodes.name] ?? [])
      : [];

  const snapshot =
    latestVersionWithCodes && latestVersionAxialCodes.length > 0
      ? axialCodesToSnapshot(
          latestVersionAxialCodes,
          latestVersionWithCodes.name,
          stats?.versionTotalTraceCount[latestVersionWithCodes.name] ?? 0,
          latestVersionAxialCodes.reduce((sum, c) => sum + c.openCodeCount, 0)
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
            label="Total Versions"
            value={projectVersionCount}
            loading={isProjectLoading}
          />
          <ObjectCounterBox
            label="Total Traces"
            value={stats?.totalTraceCount ?? 0}
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Total Open codes"
            value={stats?.totalOpenCodeCount ?? 0}
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Total Axial codes"
            value={stats?.totalAxialCodeCount ?? 0}
            loading={isLoading}
          />
          <ObjectCounterBox
            label="Avg open codes per axial code"
            value={
              allAxialCodes.length > 0
                ? (
                    allAxialCodes.reduce((sum, code) => sum + code.openCodeCount, 0) /
                    allAxialCodes.length
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
        <Flex direction="column" mb="4" width="100%" gap="4">
          <BarChartStat
            data={traceTotalPerVersionChartData}
            title="Trace Total per Version"
            subtitle="Bar height = trace count per version."
            loading={isLoading}
          />

          {snapshot && (
            <Box
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
      </Flex>
    </Card>
  );
}
