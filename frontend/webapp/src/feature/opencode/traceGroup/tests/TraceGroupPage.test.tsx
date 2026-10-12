import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TraceDetailView, TraceGroupDetail } from '../../../../shared/types/trace';
import TraceGroupPage from '../TraceGroupPage';

const { useTraceGroup, useParams, useSearchParams, updateSearchParam } = vi.hoisted(() => ({
  useTraceGroup: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  updateSearchParam: vi.fn(),
}));

vi.mock('../../../traces/hooks/useTraceGroup', () => ({ useTraceGroup }));
vi.mock('react-router', () => ({ useParams, useSearchParams }));
vi.mock('../../hooks/useUpdateSearchParam', () => ({
  useUpdateSearchParam: () => updateSearchParam,
}));
vi.mock('../LLM/LlmContent', () => ({
  LlmContent: ({ selectedTraceId }: { selectedTraceId: string | null }) => (
    <div data-testid="llm-content">{selectedTraceId}</div>
  ),
}));
vi.mock('../trace/TraceTreeNav', () => ({
  TraceTreeNav: ({ trace }: { trace: TraceDetailView }) => (
    <div data-testid="trace-tree-nav">{trace.traceId}</div>
  ),
}));
vi.mock('../trace/TraceContentOverview', () => ({
  TraceContentOverview: ({ trace }: { trace: TraceDetailView }) => (
    <div data-testid="trace-overview">{trace.traceId}</div>
  ),
}));
vi.mock('../../../../shared/components/CustomResizeHandle', () => ({ default: () => null }));

function createGroup(): TraceGroupDetail {
  const trace = (traceId: string): TraceDetailView => ({
    traceId,
    traceCollectionId: 'collection-1',
    collectionName: 'Test collection',
    collectionCreatedAt: '2026-01-01T00:00:00.000Z',
    traceResources: [],
    traceScopes: [
      {
        name: 'test-scope',
        version: '1.0',
        spans: [
          {
            traceScopeSpanId: `span-${traceId}`,
            spanKind: 'Internal',
            parentId: null,
            name: 'chat completion',
            startTimeUnixNano: 1,
            endTimeUnixNano: 2,
            attributes: [
              {
                key: 'gen_ai.input.messages',
                value: JSON.stringify([{ role: 'user', content: `Question ${traceId}` }]),
                traceAttributeType: 'String',
              },
            ],
            events: [],
          },
        ],
      },
    ],
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  return {
    traceGroupId: 'group-1',
    traceGroupType: 'LlmGroup',
    traces: [trace('trace-1'), trace('trace-2')],
  };
}

describe('TraceGroupPage', () => {
  it('shows loading and error states while trace details are unavailable', () => {
    useParams.mockReturnValue({ id: 'project-1', versionId: 'version-1', traceGroupId: 'group-1' });
    useSearchParams.mockReturnValue([new URLSearchParams()]);

    useTraceGroup.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    const { rerender } = render(<TraceGroupPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    useTraceGroup.mockReturnValue({ isLoading: false, isError: true, data: undefined });
    rerender(<TraceGroupPage />);
    expect(screen.getByText('Error loading trace group details.')).toBeInTheDocument();
  });

  it('defaults to the first trace and selects the next trace with the down arrow', () => {
    useParams.mockReturnValue({ id: 'project-1', versionId: 'version-1', traceGroupId: 'group-1' });
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    updateSearchParam.mockReset();
    useTraceGroup.mockReturnValue({
      isLoading: false,
      isError: false,
      data: createGroup(),
    });

    render(<TraceGroupPage />);

    expect(screen.getByTestId('llm-content')).toHaveTextContent('trace-1');
    expect(screen.getByTestId('trace-tree-nav')).toHaveTextContent('trace-1');

    fireEvent.keyDown(window, { key: 'ArrowDown' });

    expect(updateSearchParam).toHaveBeenCalledWith('traceId', 'trace-2');
  });

  it('honors a trace selected in the URL', () => {
    useParams.mockReturnValue({ id: 'project-1', versionId: 'version-1', traceGroupId: 'group-1' });
    useSearchParams.mockReturnValue([new URLSearchParams('traceId=trace-2')]);
    useTraceGroup.mockReturnValue({
      isLoading: false,
      isError: false,
      data: createGroup(),
    });

    render(<TraceGroupPage />);

    expect(screen.getByTestId('llm-content')).toHaveTextContent('trace-2');
    expect(screen.getByTestId('trace-overview')).toHaveTextContent('trace-2');
  });
});
