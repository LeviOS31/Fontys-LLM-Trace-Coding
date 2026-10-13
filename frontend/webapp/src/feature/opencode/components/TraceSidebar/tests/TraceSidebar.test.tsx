import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TraceGroupSummaryItem } from '../../../../../shared/types/trace';
import TraceSidebar from '../TraceSidebar';

const { navigate, useMatch, useLocation, useSearchParams, useTraceGroupSummaryList } = vi.hoisted(
  () => ({
    navigate: vi.fn(),
    useMatch: vi.fn(),
    useLocation: vi.fn(),
    useSearchParams: vi.fn(),
    useTraceGroupSummaryList: vi.fn(),
  })
);

vi.mock('react-router', () => ({
  useNavigate: () => navigate,
  useMatch,
  useLocation,
  useSearchParams,
}));

vi.mock('../../../../traces/hooks/useTraceGroupSummaryList.ts', () => ({
  useTraceGroupSummaryList,
}));

vi.mock('../TraceSidebarFilters.tsx', () => ({
  default: () => null,
}));

vi.mock('../TraceSidebarItem.tsx', () => ({
  default: ({ group, onClick }: { group: TraceGroupSummaryItem; onClick: () => void }) => (
    <button onClick={onClick}>{group.groupTitle}</button>
  ),
}));

vi.mock('../../../../traces/components/ImportTraceCollectionModal.tsx', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div role="dialog">Import traces</div> : null),
}));

const groups: TraceGroupSummaryItem[] = [
  {
    traceGroupId: 'group-1',
    groupTitle: 'Checkout flow',
    collectionName: 'Production traces',
    collectionCreatedAt: '2026-04-05T10:00:00.000Z',
    traceCount: 1,
    amountOfSpans: 2,
    amountOfOpenCodes: 0,
    amountOfAxialCodes: 0,
    needsAxialCodeUpdate: false,
  },
  {
    traceGroupId: 'group-2',
    groupTitle: 'Search flow',
    collectionName: 'Production traces',
    collectionCreatedAt: '2026-04-05T10:00:00.000Z',
    traceCount: 1,
    amountOfSpans: 2,
    amountOfOpenCodes: 0,
    amountOfAxialCodes: 0,
    needsAxialCodeUpdate: false,
  },
];

beforeEach(() => {
  navigate.mockReset();
  useMatch.mockReturnValue({ params: { traceGroupId: 'group-1' } });
  useLocation.mockReturnValue({ search: '?traceId=old-trace&q=checkout' });
  useSearchParams.mockReturnValue([new URLSearchParams('traceId=old-trace&q=checkout')]);
  useTraceGroupSummaryList.mockReturnValue({
    data: { pages: [{ items: groups, totalCount: 2 }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
  });

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();

      constructor(callback: IntersectionObserverCallback) {
        expect(callback).toBeTypeOf('function');
      }
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TraceSidebar', () => {
  it('opens the selected group and removes the previous trace from the URL', () => {
    render(<TraceSidebar projectId="project-1" projectVersionId="version-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Search flow' }));

    expect(navigate).toHaveBeenCalledWith({
      pathname: '/projects/project-1/versions/version-1/open-code/group-2',
      search: 'q=checkout',
    });
  });

  it('uses the left and right arrow keys to navigate between groups', () => {
    render(<TraceSidebar projectId="project-1" projectVersionId="version-1" />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(navigate).toHaveBeenCalledWith({
      pathname: '/projects/project-1/versions/version-1/open-code/group-2',
      search: 'q=checkout',
    });
  });

  it('opens the import dialog with the I shortcut', () => {
    render(<TraceSidebar projectId="project-1" projectVersionId="version-1" />);

    fireEvent.keyDown(window, { key: 'i' });

    expect(screen.getByRole('dialog')).toHaveTextContent('Import traces');
  });
});
