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
};

function getLlmMessages(traceGroup: ReturnType<typeof useTraceGroup>['data']): LlmMessage[] {
  const msgs: LlmMessage[] = [];

  for (const trace of traceGroup?.traces ?? []) {
    for (const scope of trace.traceScopes) {
      for (const span of scope.spans) {
        const hasLlmAttribute = span.attributes.some((attr) => attr.key.startsWith('gen_ai'));
        if (!hasLlmAttribute) continue;

        let i = 0;
        while (true) {
          const roleAttr = span.attributes.find((attr) => attr.key === `gen_ai.prompt.${i}.role`);
          const contentAttr = span.attributes.find(
            (attr) => attr.key === `gen_ai.prompt.${i}.content`
          );
          if (!roleAttr || !contentAttr) break;

          // Deduping: if a previous trace already has ownership of the message, ignore and continue.
          if (
            msgs.some(
              (m) => m.content === contentAttr.value && m.role === roleAttr.value && m.index === i
            )
          ) {
            i++;
            continue;
          }

          msgs.push({
            role: roleAttr.value as LlmRole,
            content: contentAttr.value,
            index: i,
            relatedTraceId: trace.traceId,
            relatedSpanId: span.traceScopeSpanId,
            modelName: span.attributes.find((attr) => attr.key === 'gen_ai.request.model')?.value,
            amountOfSpans: trace.traceScopes.reduce((acc, s) => acc + s.spans.length, 0),
          });
          i++;
        }

        const completionRoleAttr = span.attributes.find(
          (attr) => attr.key === `gen_ai.completion.0.role`
        );
        const completionContentAttr = span.attributes.find(
          (attr) => attr.key === `gen_ai.completion.0.content`
        );
        if (completionRoleAttr && completionContentAttr) {
          msgs.push({
            role: completionRoleAttr.value as LlmRole,
            content: completionContentAttr.value,
            index: i,
            relatedTraceId: trace.traceId,
            relatedSpanId: span.traceScopeSpanId,
          });
        }
      }
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

  const isLlmGroup = useMemo(
    () => selectedTraceGroup?.traceGroupType === 'LlmGroup',
    [selectedTraceGroup]
  );

  const [scrollSpanIndex, setScrollSpanIndex] = useState<string | null>(null);
  const [scrollMessageRole, setScrollMessageRole] = useState<'user' | 'assistant' | null>(null);
  const [chatScrollRequest, setChatScrollRequest] = useState(0);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

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

  const llmMessages = useMemo(() => {
    if (!isLlmGroup) return [];
    return getLlmMessages(selectedTraceGroup);
  }, [isLlmGroup, selectedTraceGroup]);

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
                requestChatScroll={(spanId, role) => {
                  setChatScrollRequest((request) => request + 1);
                  setScrollSpanIndex(spanId);
                  setScrollMessageRole(role);
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
                onScrollChange={(_traceId, spanId, role) => {
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
                requestChatScroll={(spanId, role) => {
                  setChatScrollRequest((request) => request + 1);
                  setScrollSpanIndex(spanId);
                  setScrollMessageRole(role);
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
