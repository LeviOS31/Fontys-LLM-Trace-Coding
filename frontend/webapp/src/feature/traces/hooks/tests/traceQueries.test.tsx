import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTraces } from '../../../../shared/api/traces';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { TraceGroupSummaryItem } from '../../../../shared/types/trace';
import { useTraceGroupSummaryList } from '../useTraceGroupSummaryList';

vi.mock('../../../../shared/api/traces.ts', () => ({ getTraces: vi.fn() }));

const page = {
  items: [] as TraceGroupSummaryItem[],
  page: 1,
  pageSize: 20,
  totalCount: 0,
  hasNextPage: false,
};

describe('useTraceGroupSummaryList', () => {
  beforeEach(() => vi.mocked(getTraces).mockReset());

  it('fetches page one with search, collection, and open-code filters', async () => {
    const client = new QueryClient();
    vi.mocked(getTraces).mockResolvedValue(page);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        useTraceGroupSummaryList('project-1', 'version-1', 'support case', true, 'collection-1'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data?.pages).toEqual([page]));
    expect(getTraces).toHaveBeenCalledWith('project-1', {
      projectVersionId: 'version-1',
      page: 1,
      pageSize: 20,
      filters: ['search:support case', 'tracecollection:collection-1', 'hasNoOpenCode'],
    });
    expect(client.getQueryCache().findAll({ queryKey: QUERY_KEYS.traces.lists })).toHaveLength(1);
  });

  it('converts All to no collection filter and fetches the next page when available', async () => {
    const client = new QueryClient();
    vi.mocked(getTraces)
      .mockResolvedValueOnce({ ...page, hasNextPage: true })
      .mockResolvedValueOnce({ ...page, page: 2 });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useTraceGroupSummaryList('project-1', 'version-1', '', false, 'All'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(getTraces).toHaveBeenNthCalledWith(1, 'project-1', {
      projectVersionId: 'version-1',
      page: 1,
      pageSize: 20,
      filters: [],
    });
    expect(getTraces).toHaveBeenNthCalledWith(2, 'project-1', {
      projectVersionId: 'version-1',
      page: 2,
      pageSize: 20,
      filters: [],
    });
  });

  it('does not fetch until project and version ids are present', () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    renderHook(() => useTraceGroupSummaryList('', '', '', false), { wrapper });

    expect(getTraces).not.toHaveBeenCalled();
  });
});