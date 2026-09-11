import { Flex, ScrollArea } from '@radix-ui/themes';
import type { TraceDetailView } from '../../../../shared/types/trace';
import { TraceContent } from './TraceContent';
import ContentSubPanel from './ContentSubPanel';

type Props = {
  trace: TraceDetailView;
  projectId: string;
  versionId?: string;
  setScrollSpanIndex: (spanId: string | null) => void;
};

export function TraceContentOverview({
  trace,
  setScrollSpanIndex,
  projectId,
  versionId,
}: Readonly<Props>) {
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const source = event.currentTarget;
    const viewport = source.matches('[data-radix-scroll-area-viewport]')
      ? source
      : source.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.top + viewportRect.height / 2;

    let closestSpanId: string | null = null;
    let minDistanceToCenter = Infinity;

    for (const scope of trace.traceScopes) {
      for (const span of scope.spans) {
        const element = document.querySelector(
          `[data-span-id="${span.traceScopeSpanId}"]`
        ) as HTMLElement;

        if (element) {
          const elementRect = element.getBoundingClientRect();
          const elementCenter = elementRect.top + elementRect.height / 2;
          const distanceToCenter = Math.abs(viewportCenter - elementCenter);

          if (distanceToCenter < minDistanceToCenter) {
            minDistanceToCenter = distanceToCenter;
            closestSpanId = span.traceScopeSpanId;
          }
        }
      }
    }

    setScrollSpanIndex(closestSpanId);
  };

  return (
    <Flex direction="column" style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ScrollArea
          type="hover"
          scrollbars="vertical"
          style={{ height: '100%' }}
          onScroll={onScroll}
        >
          <TraceContent trace={trace} projectId={projectId} versionId={versionId!} />
        </ScrollArea>
      </div>

      <ContentSubPanel trace={trace} projectId={projectId} versionId={versionId!} />
    </Flex>
  );
}
