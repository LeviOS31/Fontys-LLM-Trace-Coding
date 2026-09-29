import { useState } from 'react';
import { Flex, IconButton, ScrollArea } from '@radix-ui/themes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { TraceDetailView } from '../../../../shared/types/trace';
import { TraceContent } from './TraceContent';
import ContentSubPanel from './ContentSubPanel';

type Props = {
  trace: TraceDetailView;
  projectId: string;
  versionId?: string;
  setScrollSpanIndex: (spanId: string | null) => void;
};

const BUTTON_OFFSET = 12;

export function TraceContentOverview({ trace, projectId, versionId }: Readonly<Props>) {
  const [isTraceDetailCollapsed, setIsTraceDetailCollapsed] = useState(true);
  const [isCollapseButtonHovered, setIsCollapseButtonHovered] = useState(false);

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      {!isTraceDetailCollapsed && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ScrollArea type="hover" scrollbars="vertical" style={{ height: '100%' }}>
            <TraceContent trace={trace} projectId={projectId} versionId={versionId!} />
          </ScrollArea>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          flex: isTraceDetailCollapsed ? 1 : 'none',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: `${BUTTON_OFFSET}px`,
        }}
      >
        <IconButton
          size="1"
          variant="surface"
          radius="full"
          onClick={() => setIsTraceDetailCollapsed((prev) => !prev)}
          onMouseEnter={() => setIsCollapseButtonHovered(true)}
          onMouseLeave={() => setIsCollapseButtonHovered(false)}
          aria-label={isTraceDetailCollapsed ? 'Expand trace details' : 'Collapse trace details'}
          style={{
            position: 'absolute',
            top: `${BUTTON_OFFSET}px`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            border: `1.5px solid ${isCollapseButtonHovered ? 'var(--green-10)' : 'var(--green-9)'}`,
            backgroundColor: isCollapseButtonHovered
              ? 'var(--green-3)'
              : 'var(--color-panel-solid)',
            transition: 'background-color 120ms, border-color 120ms',
          }}
        >
          {isTraceDetailCollapsed ? (
            <ChevronDown size={14} strokeWidth={3} color="var(--green-9)" />
          ) : (
            <ChevronUp size={14} strokeWidth={3} color="var(--green-9)" />
          )}
        </IconButton>

        <ContentSubPanel trace={trace} projectId={projectId} versionId={versionId!} />
      </div>
    </Flex>
  );
}
