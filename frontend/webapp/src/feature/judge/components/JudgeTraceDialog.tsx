import { lazy, Suspense, useMemo } from 'react';
import { Box, Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getTrace } from '../../../shared/api/traces';
import type { TraceDetailView } from '../../../shared/types/trace';
import { getLlmMessages } from '../../opencode/traceGroup/LLM/traceMessages';

const LlmContent = lazy(() =>
  import('../../opencode/traceGroup/LLM/LlmContent').then((module) => ({
    default: module.LlmContent,
  }))
);

type Props = {
  readonly projectId: string;
  readonly versionId: string;
  readonly traceId: string;
  readonly onClose: () => void;
};

type TraceContent = Pick<TraceDetailView, 'traceId' | 'traceScopes'>;

export default function JudgeTraceDialog({ projectId, versionId, traceId, onClose }: Props) {
  const traceQuery = useQuery({
    queryKey: ['judgeTraceContent', projectId, versionId, traceId],
    queryFn: ({ signal }) => getTrace(projectId, versionId, traceId, signal),
    retry: false,
  });
  const trace: TraceContent | undefined = traceQuery.data;
  const llmMessages = useMemo(() => (trace ? getLlmMessages([trace]) : []), [trace]);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Content
        maxWidth="960px"
        style={{
          height: '80vh',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Flex align="start" justify="between" gap="3" mb="3">
          <Box>
            <Dialog.Title>Trace content</Dialog.Title>
            <Dialog.Description size="2" color="gray">
              Trace ID: {traceId}
            </Dialog.Description>
          </Box>
          <Button
            type="button"
            variant="ghost"
            color="gray"
            aria-label="Close trace content"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </Flex>

        <Box style={{ flex: 1, minHeight: 0 }}>
          {traceQuery.isPending ? (
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Text>Loading trace content…</Text>
            </Flex>
          ) : traceQuery.isError ? (
            <Text color="red">
              Could not load trace content:{' '}
              {traceQuery.error instanceof Error ? traceQuery.error.message : String(traceQuery.error)}
            </Text>
          ) : llmMessages.length === 0 ? (
            <Text color="gray">No LLM messages are available for this trace.</Text>
          ) : (
            <Suspense
              fallback={
                <Flex align="center" justify="center" style={{ height: '100%' }}>
                  <Text>Loading LLM content…</Text>
                </Flex>
              }
            >
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
          )}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}