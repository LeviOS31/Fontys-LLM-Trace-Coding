import { lazy, Suspense, useMemo } from 'react';
import { Box, Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getTrace } from '../../../shared/api/traces';
import { getLlmMessages } from '../../opencode/traceGroup/LLM/traceMessages';
import { getRawLLMOutputById } from '../../../shared/api/rawllmoutput';
import { ApiError } from '../../../shared/types/ApiError';
import styles from '../../judge/JudgePage.module.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

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

export default function JudgeTraceDialog({ projectId, versionId, traceId, onClose }: Props) {
const contentQuery = useQuery({
  queryKey: ['judgeTraceContent', projectId, versionId, traceId],
  queryFn: async ({ signal }) => {
    try {
      return {
        kind: 'trace' as const,
        data: await getTrace(projectId, versionId, traceId, signal),
      };
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error;

      return {
        kind: 'raw' as const,
        data: await getRawLLMOutputById(projectId, versionId, traceId),
      };
    }
  },
  retry: false,
});
  const trace = contentQuery.data?.kind === 'trace' ? contentQuery.data.data : undefined;
  const rawOutput = contentQuery.data?.kind === 'raw' ? contentQuery.data.data : undefined;

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
          height: rawOutput ? 'auto' : '80vh',    
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Flex align="start" justify="between" gap="3" mb="3">
          <Box>
            <Dialog.Title>{rawOutput ? 'Raw LLM content' : 'Trace content'}</Dialog.Title>
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

        <Box
          style={{
            flex: rawOutput ? '0 1 auto' : 1,
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {contentQuery.isPending ? (
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Text>Loading trace content…</Text>
            </Flex>
          ) : contentQuery.isError ? (
            <Text color="red">
              Could not load trace content:{' '}
              {contentQuery.error instanceof Error ? contentQuery.error.message : String(contentQuery.error)}
            </Text>
          ) : trace != undefined ? (
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
          ): rawOutput != undefined ? (
            <div 
              className={styles.card}
              style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--gray-6)',
                  padding: '0px',
                  width: '99%',
                  minWidth: 0,
                  minHeight: 0,
              }}
            >
                <p
                    style={{
                        paddingLeft: '10px',
                        marginTop: '10px',
                        marginBottom: '10px',
                    }}
                >{rawOutput.name}</p>
                <div
                    style={{
                        border: '1px solid var(--gray-6)',
                        width: '100%',
                    }}
                ></div>
                <SyntaxHighlighter  
                  language="json"
                  wrapLongLines
                  codeTagProps={{
                    style: {
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      maxWidth: '100%',
                    },
                  }}
                  customStyle={{
                    margin: 0,
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                  }}
                >
                  {rawOutput.output}
                </SyntaxHighlighter>
            </div>
          ):(
            <Text color="gray">No LLM messages are available for this trace.</Text>
          )}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}