import { Flex, Text } from '@radix-ui/themes';
import { useTraceGroup } from '../../traces/hooks/useTraceGroup';
import { useParams, useSearchParams } from 'react-router';
import { Group as ResizableGroup, Panel as ResizablePanel } from 'react-resizable-panels';
import CustomResizeHandle from '../../../shared/components/CustomResizeHandle';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isTyping } from '../../../shared/util/shortcutHelpers';
import { useUpdateSearchParam } from '../hooks/useUpdateSearchParam';
import { LlmContent } from './LLM/LlmContent';
import { TraceTreeNav } from './trace/TraceTreeNav';
import { TraceContentOverview } from './trace/TraceContentOverview';
import { extractSpanMessages } from './trace/GenAIMessages';
import { getRetrievedSourcesForUserSpan, type RetrievedSource } from './trace/retrievalSources';

export type PageParams = {
  id: string;
  versionId: string;
  traceGroupId: string;
};

export type LlmRole = 'user' | 'assistant' | 'system';
export type LlmMessage = {
  role: LlmRole;
  content: string;
  index: number;
  relatedTraceId: string;
  relatedSpanId: string;
  modelName?: string;
  amountOfSpans?: number;
  retrievedSources?: RetrievedSource[];
};

function mergeRetrievedSources(
  current: RetrievedSource[] = [],
  added: RetrievedSource[] = []
): RetrievedSource[] {
  const sources = new Map(current.map((source) => [source.sourceFile, source]));
  for (const source of added) {
    const existing = sources.get(source.sourceFile);
    if (!existing) {
      sources.set(source.sourceFile, source);
      continue;
    }
    existing.retrievalSpanIds = [
      ...new Set([...existing.retrievalSpanIds, ...source.retrievalSpanIds]),
    ];
    for (const chunk of source.chunks) {
      if (!chunk.id || !existing.chunks.some((currentChunk) => currentChunk.id === chunk.id)) {
        existing.chunks.push(chunk);
      }
    }
  }
  return [...sources.values()];
}

function scrollToRetrievedSource(traceId: string, spanId: string, sourceFile: string): void {
  requestAnimationFrame(() => {
    const target = document.querySelector(
      `[data-trace-id="${CSS.escape(traceId)}"][data-span-id="${CSS.escape(spanId)}"]` +
        `[data-message-role="user"] details[data-source-file="${CSS.escape(sourceFile)}"]`
    );
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function getLlmMessages(traceGroup: ReturnType<typeof useTraceGroup>['data']): LlmMessage[] {
  const msgs: LlmMessage[] = [];
  const attr = (attributes: { key: string; value: string }[], key: string) =>
    attributes.find((a) => a.key === key)?.value;

  for (const trace of traceGroup?.traces ?? []) {
    const spans = trace.traceScopes.flatMap((scope) => scope.spans);
    const amountOfSpans = trace.traceScopes.reduce((acc, s) => acc + s.spans.length, 0);
    const outputOnly: LlmMessage[] = [];

    for (const scope of trace.traceScopes) {
      for (const span of scope.spans) {
        const extracted = extractSpanMessages(span.attributes);
        if (!extracted) continue;

        const modelName =
          attr(span.attributes, 'gen_ai.request.model') ||
          attr(span.attributes, 'gen_ai.response.model');

        extracted.messages.forEach((message, index) => {
          const entry: LlmMessage = {
            ...message,
            index,
            relatedTraceId: trace.traceId,
            relatedSpanId: span.traceScopeSpanId,
            modelName,
            amountOfSpans,
            ...(message.role === 'user'
              ? {
                  retrievedSources: getRetrievedSourcesForUserSpan(
                    spans,
                    span.traceScopeSpanId,
                    message.content
                  ),
                }
              : {}),
          };
          // Spans without input messages have no reliable index; handled after this loop.
          if (!extracted.hasInput) {
            outputOnly.push(entry);
            return;
          }
          // Dedupe: an earlier trace/span already owns this message at this position.
          const duplicate = msgs.find(
            (m) => m.content === entry.content && m.role === entry.role && m.index === entry.index
          );
          if (duplicate) {
            duplicate.retrievedSources = mergeRetrievedSources(
              duplicate.retrievedSources,
              entry.retrievedSources
            );
          } else {
            msgs.push(entry);
          }
        });
      }
    }

    // Output-only spans often repeat an answer that another span already recorded.
    for (const entry of outputOnly) {
      const duplicate = msgs.some((m) => m.content === entry.content && m.role === entry.role);
      if (!duplicate) msgs.push(entry);
    }
  }

  return msgs;
}

export default function TraceGroupPage() {
  const { id, versionId, traceGroupId } = useParams<PageParams>();

  const {
    data: selectedTraceGroup,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useTraceGroup(id!, traceGroupId!, versionId!);

  const llmMessages = useMemo(() => getLlmMessages(selectedTraceGroup), [selectedTraceGroup]);

  // A group counts as an LLM group when the backend says so, or when its spans carry messages.
  const isLlmGroup = useMemo(
    () => selectedTraceGroup?.traceGroupType === 'LlmGroup' || llmMessages.length > 0,
    [selectedTraceGroup, llmMessages]
  );

  const [scrollSpanIndex, setScrollSpanIndex] = useState<string | null>(null);
  const [scrollMessageRole, setScrollMessageRole] = useState<
    'user' | 'assistant' | 'system' | null
  >(null);
  const [chatScrollRequest, setChatScrollRequest] = useState(0);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [selectedSourceFile, setSelectedSourceFile] = useState<string | null>(null);

  // The selected trace lives in the URL so the sidebar can drive it and a trace
  // can be linked to directly.
  const [searchParams] = useSearchParams();
  const updateSearchParam = useUpdateSearchParam();
  const selectedTrace = searchParams.get('traceId');

  const setSelectedTrace = useCallback(
    (traceId: string) => updateSearchParam('traceId', traceId),
    [updateSearchParam]
  );

  // Defaults to the first trace of the group until the user selects another one.
  const effectiveSelectedTrace = useMemo(() => {
    if (!selectedTraceGroup) return null;
    const traces = selectedTraceGroup.traces;
    if (selectedTrace && traces.some((t) => t.traceId === selectedTrace)) return selectedTrace;
    return traces[0]?.traceId ?? null;
  }, [selectedTraceGroup, selectedTrace]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const traces = selectedTraceGroup?.traces ?? [];

    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if (traces.length === 0) return;

      e.preventDefault();
      const currentIndex = traces.findIndex((t) => t.traceId === effectiveSelectedTrace);
      const nextIndex =
        e.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, traces.length - 1)
          : Math.max(currentIndex - 1, 0);
      const nextTrace = traces[nextIndex];
      if (nextTrace) setSelectedTrace(nextTrace.traceId);
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [selectedTraceGroup, effectiveSelectedTrace, setSelectedTrace]);

  const selectedTraceObject = useMemo(() => {
    if (!effectiveSelectedTrace || !selectedTraceGroup) return null;
    return selectedTraceGroup.traces.find((t) => t.traceId === effectiveSelectedTrace) ?? null;
  }, [effectiveSelectedTrace, selectedTraceGroup]);

  // The sidebar lives in the layout route, so it stays mounted while the group
  // details load and only this panel shows the loading state.
  if (isDetailLoading || isDetailError) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        {isDetailError ? (
          <Text color="red">Error loading trace group details.</Text>
        ) : (
          <Text>Loading...</Text>
        )}
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="2" style={{ height: '100%', minHeight: 0 }}>
      <ResizableGroup
        orientation="horizontal"
        style={{ width: '100%', height: '100%', minHeight: 0 }}
      >
        {isLlmGroup && selectedTraceObject && (
          <>
            <ResizablePanel defaultSize={22} minSize={18}>
              <TraceTreeNav
                trace={selectedTraceObject}
                selectedSpanId={scrollSpanIndex}
                setSelectedTrace={setSelectedTrace}
                setSelectedSpan={setScrollSpanIndex}
                requestChatScroll={(spanId, role, sourceFile) => {
                  setChatScrollRequest((request) => request + 1);
                  setScrollSpanIndex(spanId);
                  setScrollMessageRole(role);
                  setSelectedSourceFile(sourceFile ?? null);
                  if (sourceFile && effectiveSelectedTrace) {
                    scrollToRetrievedSource(effectiveSelectedTrace, spanId, sourceFile);
                  }
                }}
                messageAnchors={llmMessages.filter(
                  (message): message is LlmMessage & { role: 'user' | 'assistant' | 'system' } =>
                    message.role === 'user' ||
                    message.role === 'assistant' ||
                    message.role === 'system'
                )}
                selectedNodeKey={selectedNodeKey}
                setSelectedNodeKey={setSelectedNodeKey}
              />
            </ResizablePanel>

            <CustomResizeHandle />

            <ResizablePanel defaultSize={78} minSize={40}>
              <LlmContent
                llmMessages={llmMessages}
                selectedTraceId={effectiveSelectedTrace}
                setSelectedTrace={setSelectedTrace}
                scrollRequest={chatScrollRequest}
                selectedSpanId={scrollSpanIndex}
                selectedMessageRole={scrollMessageRole}
                selectedSourceFile={selectedSourceFile}
                onScrollChange={(_traceId, spanId, role) => {
                  if (selectedSourceFile && spanId === scrollSpanIndex && role === 'user') {
                    setSelectedNodeKey(
                      `${spanId}-source-${encodeURIComponent(selectedSourceFile)}`
                    );
                    return;
                  }
                  setSelectedSourceFile(null);
                  setSelectedNodeKey(spanId && role ? `${spanId}-${role}` : spanId);
                }}
              />
            </ResizablePanel>

            {effectiveSelectedTrace && (
              <>
                <CustomResizeHandle />

                <ResizablePanel defaultSize={30} minSize={25} style={{ overflow: 'visible' }}>
                  <TraceContentOverview
                    trace={selectedTraceObject!}
                    setScrollSpanIndex={setScrollSpanIndex}
                    projectId={id!}
                    versionId={versionId!}
                  />
                </ResizablePanel>
              </>
            )}
          </>
        )}

        {!isLlmGroup && effectiveSelectedTrace && (
          <>
            <ResizablePanel defaultSize={30} minSize={20}>
              <TraceTreeNav
                trace={selectedTraceObject!}
                selectedSpanId={scrollSpanIndex}
                setSelectedTrace={setSelectedTrace}
                setSelectedSpan={setScrollSpanIndex}
                requestChatScroll={(spanId, role, sourceFile) => {
                  setChatScrollRequest((request) => request + 1);
                  setScrollSpanIndex(spanId);
                  setScrollMessageRole(role);
                  setSelectedSourceFile(sourceFile ?? null);
                  if (sourceFile && effectiveSelectedTrace) {
                    scrollToRetrievedSource(effectiveSelectedTrace, spanId, sourceFile);
                  }
                }}
                messageAnchors={llmMessages.filter(
                  (message): message is LlmMessage & { role: 'user' | 'assistant' | 'system' } =>
                    message.role === 'user' ||
                    message.role === 'assistant' ||
                    message.role === 'system'
                )}
                selectedNodeKey={selectedNodeKey}
                setSelectedNodeKey={setSelectedNodeKey}
              />
            </ResizablePanel>

            <CustomResizeHandle />

            <ResizablePanel defaultSize={25} minSize={25} style={{ overflow: 'visible' }}>
              <TraceContentOverview
                trace={selectedTraceObject!}
                setScrollSpanIndex={setScrollSpanIndex}
                projectId={id!}
                versionId={versionId!}
              />
            </ResizablePanel>
          </>
        )}
      </ResizableGroup>
    </Flex>
  );
}
