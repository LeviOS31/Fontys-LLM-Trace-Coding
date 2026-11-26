import { lazy, Suspense, useMemo, useState } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { getTrace } from '../../../shared/api/traces';
import { getLlmMessages } from '../../opencode/traceGroup/LLM/traceMessages';
import type { JudgeResult } from '../hooks/judgeUtils';

const LlmContent = lazy(() =>
  import('../../opencode/traceGroup/LLM/LlmContent').then((module) => ({
    default: module.LlmContent,
  }))
);

type Props = {
  readonly projectId: string;
  readonly versionId: string;
  readonly results: JudgeResult[];
  readonly onClose: () => void;
};

export default function JudgeEvaluation({ projectId, versionId, results, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const selectedResult = results[currentIndex];
  const traceId = selectedResult?.traceId ?? '';

  const contentQuery = useQuery({
    queryKey: ['judgeTraceContent', projectId, versionId, traceId],
    queryFn: ({ signal }) => getTrace(projectId, versionId, traceId, signal),
    retry: false,
  });

  const trace = contentQuery.data;
  const llmMessages = useMemo(() => (trace ? getLlmMessages([trace]) : []), [trace]);

  return (
    <Box>
        <Flex align="center" justify="between" gap="3" mb="3" wrap="wrap">
            <Box>
                <Text as="p" size="4" weight="bold">
                    Evaluate results
                </Text>
                <Text size="2" color="gray">
                    Trace {currentIndex + 1} of {results.length}: {traceId}
                </Text>
            </Box>
            <Flex gap="2">
                <Button type="button" variant="soft" color="gray" onClick={onClose}>
                    Back to results
                </Button>
                <Button
                    type="button"
                    onClick={() => setCurrentIndex((index) => Math.min(index + 1, results.length - 1))}
                    disabled={currentIndex >= results.length - 1}
                >
                    Next trace
                </Button>
        </Flex>
        </Flex>
        <div>
            <p>{selectedResult.verdict}</p>
            <p>{selectedResult.reasoning}</p>
        </div>
    <Box
    style={{
        minHeight: 240,
        maxHeight: '70vh',
        overflow: 'auto',
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-3)',
    }}
    >
        {contentQuery.isPending ? (
          <Text>Loading trace content…</Text>
        ) : contentQuery.isError ? (
          <Text color="red">
            Could not load trace content:{' '}
            {contentQuery.error instanceof Error
              ? contentQuery.error.message
              : String(contentQuery.error)}
          </Text>
        ) : trace ? (
          <Suspense fallback={<Text>Loading LLM content…</Text>}>
            <LlmContent
              llmMessages={llmMessages}
              selectedTraceId={traceId}
              selectedSpanId={null}
              selectedMessageRole={null}
              selectedSourceFile={null}
              setSelectedTrace={() => undefined}
              scrollRequest={0}
              onScrollChange={() => undefined}
            />
          </Suspense>
        ) : (
          <Text color="gray">No LLM messages are available for this trace.</Text>
        )}
      </Box>
    </Box>
  );
}
