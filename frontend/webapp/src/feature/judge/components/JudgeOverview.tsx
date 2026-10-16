import { useMemo } from 'react';
import { Box, Card, Flex, Grid, Text } from '@radix-ui/themes';
import { formatPercent, summarize, type JudgeRun } from '../hooks/judgeUtils';
import JudgeRunCard from './JudgeRunCard';
import { SectionHead, SummaryStat } from './Primitives';

type Props = {
  readonly runs: JudgeRun[];
  readonly onSelect: (judgeRunId: string) => void;
};

export default function JudgeOverview({ runs, onSelect }: Props) {
  // General statistics across every run in this session.
  const overall = useMemo(() => summarize(runs.flatMap((run) => run.results)), [runs]);

  return (
    <>
      <Box>
        <SectionHead
          title="Overview"
          subtitle="Statistics across all judge runs in this session."
        />
        <Card>
          <Grid columns={{ initial: '2', sm: '5' }} gap="4">
            <SummaryStat label="Judge runs" value={runs.length} />
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
            No judge runs yet. Select a template above and run the judge.
          </Text>
        ) : (
          <Flex direction="column" gap="3">
            {runs.map((run) => (
              <JudgeRunCard key={run.judgeRunId} run={run} onSelect={onSelect} />
            ))}
          </Flex>
        )}
      </Box>
    </>
  );
}
