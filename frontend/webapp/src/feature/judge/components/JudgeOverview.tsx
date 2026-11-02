import { Box, Button, Card, Flex, Grid, Text } from '@radix-ui/themes';
import {
  formatPercent,
  statsFromCounts,
  type JudgeRunListItem,
  type JudgeRunTotals,
} from '../hooks/judgeUtils';
import JudgeRunCard from './JudgeRunCard';
import { SectionHead, SummaryStat } from './Primitives';

type Props = {
  readonly runs: JudgeRunListItem[];
  readonly totals: JudgeRunTotals;
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly onLoadMore: () => void;
  readonly onSelect: (judgeRunId: string) => void;
};

export default function JudgeOverview({
  runs,
  totals,
  hasMore,
  loading,
  onLoadMore,
  onSelect,
}: Props) {
  // Statistics are aggregated by the backend over every run, not just the loaded page.
  const overall = statsFromCounts(totals);

  return (
    <>
      <Box>
        <SectionHead
          title="Overview"
          subtitle="Statistics across all judge runs for this version."
        />
        <Card>
          <Grid columns={{ initial: '2', sm: '5' }} gap="4">
            <SummaryStat label="Judge runs" value={totals.runs} />
            <SummaryStat label="Traces judged" value={overall.total} />
            <SummaryStat
              label="Verdict true"
              value={`${overall.trueCount} (${formatPercent(overall.trueRate)})`}
            />
            <SummaryStat
              label="Verdict false"
              value={`${overall.falseCount} (${formatPercent(overall.falseRate)})`}
            />
            <SummaryStat label="Failed" value={overall.failedCount} />
          </Grid>
        </Card>
      </Box>

      <Box pb="9">
        <SectionHead title="Judge runs" subtitle="Select a run to see its results." />
        {runs.length === 0 ? (
          <Text as="p" size="2" color="gray">
            {loading
              ? 'Loading judge runs…'
              : 'No judge runs yet. Select a template above and run the judge.'}
          </Text>
        ) : (
          <Flex direction="column" gap="3">
            {runs.map((run) => (
              <JudgeRunCard key={run.judgeRunId} run={run} onSelect={onSelect} />
            ))}
            {hasMore && (
              <Button variant="soft" color="gray" onClick={onLoadMore} disabled={loading}>
                {loading ? 'Loading…' : `Load more (${runs.length} of ${totals.runs})`}
              </Button>
            )}
          </Flex>
        )}
      </Box>
    </>
  );
}
