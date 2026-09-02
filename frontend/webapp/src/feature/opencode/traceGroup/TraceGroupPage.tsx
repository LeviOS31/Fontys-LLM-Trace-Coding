import { Flex, Text } from '@radix-ui/themes';
import { useTraceGroup } from '../../traces/hooks/useTraceGroup';
import { useParams } from 'react-router';
import { Group as ResizableGroup, Panel as ResizablePanel } from 'react-resizable-panels';
import CustomResizeHandle from '../../../shared/components/CustomResizeHandle';
import { useEffect, useMemo, useState } from 'react';
import { isTyping } from '../../../shared/util/shortcutHelpers';
import { LlmNav } from './LLM/LlmNav';
import { LlmContent } from './LLM/LlmContent';
import { TraceNav } from './trace/TraceNav';
import { TraceContentOverview } from './trace/TraceContentOverview';
import { TraceGroupNavBar } from './TraceGroupNavBar';

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

  const [scrollTrace, setScrollTrace] = useState<string | null>(null);
  const [scrollSpanIndex, setScrollSpanIndex] = useState<string | null>(null);

  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);

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
  }, [selectedTraceGroup, effectiveSelectedTrace]);

  const llmMessages = useMemo(() => {
    if (!isLlmGroup) return [];
    return getLlmMessages(selectedTraceGroup);
  }, [isLlmGroup, selectedTraceGroup]);

  const selectedTraceObject = useMemo(() => {
    if (!effectiveSelectedTrace || !selectedTraceGroup) return null;
    return selectedTraceGroup.traces.find((t) => t.traceId === effectiveSelectedTrace) ?? null;
  }, [effectiveSelectedTrace, selectedTraceGroup]);

  // The nav bar stays mounted while the group details load, so its scroll
  // position is preserved when navigating between groups.
  if (isDetailLoading || isDetailError) {
    return (
      <Flex direction="column" gap="2">
        <TraceGroupNavBar
          projectId={id!}
          versionId={versionId!}
          activeTraceGroupId={traceGroupId!}
        />
        {isDetailError ? (
          <Text color="red">Error loading trace group details.</Text>
        ) : (
          <Text>Loading...</Text>
        )}
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="2">
      <TraceGroupNavBar projectId={id!} versionId={versionId!} activeTraceGroupId={traceGroupId!} />

      <ResizableGroup>
        {isLlmGroup && (
          <>
            <ResizablePanel defaultSize={20} minSize={20}>
              <LlmNav
                llmMessages={llmMessages}
                selectedTraceId={effectiveSelectedTrace}
                setSelectedTrace={setSelectedTrace}
                scrollTraceId={scrollTrace}
              />
            </ResizablePanel>

            <CustomResizeHandle />

            <ResizablePanel defaultSize={100} minSize={20}>
              <LlmContent
                llmMessages={llmMessages}
                selectedTraceId={effectiveSelectedTrace}
                setSelectedTrace={setSelectedTrace}
                onScrollChange={setScrollTrace}
              />
            </ResizablePanel>

            {effectiveSelectedTrace && <CustomResizeHandle />}
          </>
        )}

        {effectiveSelectedTrace && (
          <>
            <ResizablePanel defaultSize={40} minSize={20}>
              <TraceNav trace={selectedTraceObject!} scrollSpanIndex={scrollSpanIndex} />
            </ResizablePanel>

            <CustomResizeHandle />

            <ResizablePanel defaultSize={100} minSize={20}>
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
