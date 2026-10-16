import { useState } from 'react';
import { Box, Button, Card, Code, Flex, Grid, SegmentedControl, Text } from '@radix-ui/themes';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { formatDate, formatPercent, summarize, type JudgeRun } from '../hooks/judgeUtils';
import ResultCard from './ResultCard';
import { SectionHead, SummaryStat } from './Primitives';

type View = 'formatted' | 'raw';

type Props = {
  readonly run: JudgeRun;
  readonly onBack: () => void;
};

export default function JudgeRunDetails({ run, onBack }: Props) {
  const [view, setView] = useState<View>('formatted');
  const [copied, setCopied] = useState(false);

  const stats = summarize(run.results);
  const rawJson = JSON.stringify({ judgeRunId: run.judgeRunId, results: run.results }, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard unavailable error
    }
  };

  return (
    <>
      <Box>
        <Button variant="ghost" color="gray" size="2" onClick={onBack}>
          <ArrowLeft size={14} />
          All judge runs
        </Button>
        <Text as="p" size="5" weight="bold" mt="3">
          {run.templateName}
        </Text>
        <Flex align="center" gap="3" mt="1" wrap="wrap">
          <Text size="2" color="gray">
            {formatDate(run.createdAt)}
          </Text>
          <Code size="1" color="gray" variant="ghost">
            {run.judgeRunId}
          </Code>
        </Flex>
      </Box>

      <Box>
        <SectionHead title="Summary" />
        <Card>
          <Grid columns={{ initial: '2', sm: '4' }} gap="4">
            <SummaryStat label="Results" value={stats.total} />
            <SummaryStat
              label="Verdict true"
              value={`${stats.trueCount} (${formatPercent(stats.trueRate)})`}
            />
            <SummaryStat
              label="Verdict false"
              value={`${stats.falseCount} (${formatPercent(stats.falseRate)})`}
            />
            <SummaryStat label="Failed" value={stats.failedCount} />
          </Grid>
        </Card>
      </Box>

      <Box pb="9">
        <Flex align="end" justify="between" mb="3" gap="3" wrap="wrap">
          <SectionHead title="Results" subtitle="One card per trace." />
          <Flex gap="2" align="center">
            <SegmentedControl.Root
              size="1"
              value={view}
              onValueChange={(v) => setView(v as View)}
              aria-label="Response view"
            >
              <SegmentedControl.Item value="formatted">Formatted</SegmentedControl.Item>
              <SegmentedControl.Item value="raw">JSON</SegmentedControl.Item>
            </SegmentedControl.Root>
            <Button type="button" variant="soft" color="gray" size="1" onClick={copyJson}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Flex>
        </Flex>

        {view === 'raw' ? (
          <Card>
            <pre style={{ margin: 0, overflowX: 'auto', fontSize: 'var(--font-size-1)' }}>
              {rawJson}
            </pre>
          </Card>
        ) : run.results.length === 0 ? (
          <Text as="p" size="2" color="gray">
            The judge returned no results for this axial code.
          </Text>
        ) : (
          <Flex direction="column" gap="3">
            {run.results.map((r) => (
              <ResultCard key={r.traceId} result={r} />
            ))}
          </Flex>
        )}
      </Box>
    </>
  );
}
