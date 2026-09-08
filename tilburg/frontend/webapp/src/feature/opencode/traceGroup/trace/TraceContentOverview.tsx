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
    const container = event.currentTarget;
    const scrollTop = container.scrollTop;

    const containerCenter = scrollTop + container.clientHeight / 2;

    let closestSpanId: string | null = null;
    let minDistanceToCenter = Infinity;

    for (const scope of trace.traceScopes) {
      for (const span of scope.spans) {
        const element = document.querySelector(
          `[data-span-id="${span.traceScopeSpanId}"]`
        ) as HTMLElement;

        if (element) {
          const elementTop = element.offsetTop;
          const elementCenter = elementTop + element.offsetHeight / 2;
          const distanceToCenter = Math.abs(containerCenter - elementCenter);

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
    <Flex direction="column" style={{ position: 'relative', height: '90vh' }}>
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
