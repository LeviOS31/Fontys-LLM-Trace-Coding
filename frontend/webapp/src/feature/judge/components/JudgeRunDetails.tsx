import { useState } from 'react';
import { Box, Button, Card, Code, Flex, Grid, SegmentedControl, Text } from '@radix-ui/themes';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import {
  formatDate,
  formatPercent,
  statsFromCounts,
  type JudgeResult,
  type JudgeRunListItem,
} from '../hooks/judgeUtils';
import ResultCard from './ResultCard';
import { SectionHead, SummaryStat } from './Primitives';
import JudgeTraceDialog from './JudgeTraceDialog';
import JudgeEvaluation from './JudgeEvalutation';
import styles from './JudgeRunPanel.module.css';

type View = 'formatted' | 'raw';

type Props = {
  readonly run: JudgeRunListItem;
  readonly projectId: string;
  readonly versionId: string;
  readonly results: JudgeResult[] | null;
  readonly resultsLoading: boolean;
  readonly onBack: () => void;
  readonly evaluating: boolean;
};

export default function JudgeRunDetails({
  run,
  projectId,
  versionId,
  results,
  resultsLoading,
  onBack,
  evaluating,
}: Props) {
  const [view, setView] = useState<View>('formatted');
  const [copied, setCopied] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [evaluatingResults, setEvaluatingResults] = useState(false);

  const stats = statsFromCounts(run);
  const rawJson = JSON.stringify({ judgeRunId: run.judgeRunId, results }, null, 2);

  const copyJson = async () => {
    if (!results) return;
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
        <Flex align="center" justify="between">
          <Button variant="ghost" color="gray" size="2" onClick={onBack}>
            <ArrowLeft size={14} />
            All judge runs
          </Button>
        </Flex>
        <Text as="p" size="5" weight="bold" mt="3">
          {run.name ?? 'Judge run'}
        </Text>
        <Flex align="center" justify="between" gap="3" mt="1" wrap="wrap">
          <div>
          <Text size="2" color="gray"
          style={{
            marginRight: '10px',
          }}>
            {formatDate(run.createdAt)}
          </Text>
          <Code size="1" color="gray" variant="ghost">
            {run.judgeRunId}
          </Code>
          </div>
          {
            evaluating ?
            <Button
              className={styles.testingButton}
              onClick={() => setEvaluatingResults((current) => !current)}
              disabled={!results?.length}
              style={{
                alignSelf: 'flex-start',
              }}
            >
              {evaluatingResults ? 'back to results' : 'evaluate results'}
            </Button>
            : null
          }
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
            <Button
              type="button"
              variant="soft"
              color="gray"
              size="1"
              onClick={copyJson}
              disabled={!results}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Flex>
        </Flex>

        {evaluatingResults && results ? (
          <JudgeEvaluation
            key={run.judgeRunId}
            projectId={projectId}
            versionId={versionId}
            results={results}
            onClose={() => setEvaluatingResults(false)}
          />
        ) : resultsLoading || !results ? (
          <Text as="p" size="2" color="gray">
            Loading results…
          </Text>
        ) : view === 'raw' ? (
          <Card>
            <pre style={{ margin: 0, overflowX: 'auto', fontSize: 'var(--font-size-1)' }}>
              {rawJson}
            </pre>
          </Card>
        ) : results.length === 0 ? (
          <Text as="p" size="2" color="gray">
            This judge run contains no judged traces.
          </Text>
        ) : (
          <Flex direction="column" gap="3">
            {results.map((r) => (
              <ResultCard key={r.traceId} result={r} onOpen={() => setSelectedTraceId(r.traceId)} />
            ))}
          </Flex>
        )}
      </Box>
      {selectedTraceId && (
        <JudgeTraceDialog
          projectId={projectId}
          versionId={versionId}
          traceId={selectedTraceId}
          onClose={() => setSelectedTraceId(null)}
        />
      )}
    </>
  );
}
