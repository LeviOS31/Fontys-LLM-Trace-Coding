import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addOpencode } from '../../../../shared/api/traces';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { TraceGroupDetail } from '../../../../shared/types/trace';
import { useAddOpencode } from '../useAddOpencode';

vi.mock('../../../../shared/api/traces', () => ({ addOpencode: vi.fn() }));

describe('useAddOpencode', () => {
  beforeEach(() => vi.mocked(addOpencode).mockReset());

  it('posts the open code, updates the cached trace, and invalidates trace lists', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const detail: TraceGroupDetail = {
      traceGroupId: 'group-1',
      traceGroupType: 'OtherGroup',
      traces: [
        {
          traceId: 'trace-1',
          traceCollectionId: 'collection-1',
          collectionName: 'Collection',
          collectionCreatedAt: '2026-01-01T00:00:00.000Z',
          traceResources: [],
          traceScopes: [],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    queryClient.setQueryData(QUERY_KEYS.traces.detail('group-1'), detail);
    vi.mocked(addOpencode).mockResolvedValue(undefined as never);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAddOpencode('project-1', 'version-1', 'group-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ traceId: 'trace-1', openCode: 'A useful observation' });
    });

    expect(addOpencode).toHaveBeenCalledWith('project-1', 'version-1', 'trace-1', {
      openCode: 'A useful observation',
    });
    expect(
      queryClient.getQueryData<TraceGroupDetail>(QUERY_KEYS.traces.detail('group-1'))?.traces[0]
        ?.openCode
    ).toBe('A useful observation');
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.traces.lists })
    );
  });
});
