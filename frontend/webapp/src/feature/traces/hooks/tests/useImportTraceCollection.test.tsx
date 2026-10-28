import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importTraceCollection } from '../../../../shared/api/traces';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { ImportTraceCollectionDto } from '../../../../shared/types/trace.dto';
import { useImportTraceCollection } from '../useImportTraceCollection';

vi.mock('../../../../shared/api/traces.ts', () => ({ importTraceCollection: vi.fn() }));

describe('useImportTraceCollection', () => {
  beforeEach(() => vi.mocked(importTraceCollection).mockReset());

  it('imports a collection and resets only trace-list queries for that version', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const reset = vi.spyOn(client, 'resetQueries').mockResolvedValue(undefined);
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(importTraceCollection).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useImportTraceCollection(), { wrapper });
    const file = new File(['{}'], 'traces.jsonl', { type: 'application/json' });
    const payload: ImportTraceCollectionDto = {
      projectId: 'project-1',
      projectVersionId: 'version-1',
      name: 'Imported traces',
      file,
    };

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(importTraceCollection).toHaveBeenCalledWith(payload);
    expect(reset).toHaveBeenCalledOnce();
    const predicate = reset.mock.calls[0][0]?.predicate;
    expect(predicate).toBeDefined();
    expect(
      predicate!({
        queryKey: [
          'trace-lists',
          { projectVersionId: 'version-1', search: '', traceCollectionId: undefined },
        ],
      } as never)
    ).toBe(true);
    expect(
      predicate!({
        queryKey: [
          'trace-lists',
          { projectVersionId: 'version-2', search: '', traceCollectionId: undefined },
        ],
      } as never)
    ).toBe(false);
    expect(predicate!({ queryKey: ['traces', 'group-1'] } as never)).toBe(false);
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.traces.collections('version-1'),
      })
    );
  });
});