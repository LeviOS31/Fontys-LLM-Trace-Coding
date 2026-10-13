import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCollection, editTraceCollection } from '../../../../shared/api/traces';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { TraceCollectionOverview } from '../../../../shared/types/trace';
import { useDeleteCollection } from '../useDeleteCollection';
import { useEditTraceCollection } from '../useEditTraceCollection';

vi.mock('../../../../shared/api/traces.ts', () => ({
  deleteCollection: vi.fn(),
  editTraceCollection: vi.fn(),
}));

const collections: TraceCollectionOverview[] = [
  {
    traceCollectionId: 'collection-1',
    name: 'One',
    tracersCount: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    traceCollectionId: 'collection-2',
    name: 'Two',
    tracersCount: 2,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('Overview collection mutation hooks', () => {
  beforeEach(() => {
    vi.mocked(deleteCollection).mockReset();
    vi.mocked(editTraceCollection).mockReset();
  });

  it('deletes the requested collection, updates cache, and invalidates the collection query', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const queryKey = QUERY_KEYS.traces.collections('version-1');
    client.setQueryData(queryKey, collections);
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(deleteCollection).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteCollection(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'project-1',
        projectVersionId: 'version-1',
        collectionId: 'collection-1',
      });
    });

    expect(deleteCollection).toHaveBeenCalledWith('project-1', 'version-1', 'collection-1');
    expect(client.getQueryData(queryKey)).toEqual([collections[1]]);
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey }));
  });

  it('renames a collection through the API and invalidates the collection query', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(editTraceCollection).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useEditTraceCollection(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'project-1',
        projectVersionId: 'version-1',
        collectionId: 'collection-2',
        name: 'Renamed',
      });
    });

    expect(editTraceCollection).toHaveBeenCalledWith(
      'project-1',
      'version-1',
      'collection-2',
      'Renamed'
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.traces.collections('version-1'),
      })
    );
  });
});
