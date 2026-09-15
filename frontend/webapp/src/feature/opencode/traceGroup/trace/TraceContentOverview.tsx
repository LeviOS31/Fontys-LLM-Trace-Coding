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

export function TraceContentOverview({ trace, projectId, versionId }: Readonly<Props>) {
  return (
    <Flex direction="column" style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ScrollArea type="hover" scrollbars="vertical" style={{ height: '100%' }}>
          <TraceContent trace={trace} projectId={projectId} versionId={versionId!} />
        </ScrollArea>
      </div>

      <ContentSubPanel trace={trace} projectId={projectId} versionId={versionId!} />
    </Flex>
  );
}
