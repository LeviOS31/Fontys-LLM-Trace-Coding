import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTraceGroup } from '../../../../shared/api/traces';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { TraceGroupDetail } from '../../../../shared/types/trace';
import { useTraceGroup } from '../useTraceGroup';

vi.mock('../../../../shared/api/traces.ts', () => ({ getTraceGroup: vi.fn() }));

describe('useTraceGroup', () => {
  beforeEach(() => vi.mocked(getTraceGroup).mockReset());

  it('loads and caches the selected trace group', async () => {
    const client = new QueryClient();
    const detail: TraceGroupDetail = {
      traceGroupId: 'group-1',
      traceGroupType: 'OtherGroup',
      traces: [],
    };
    vi.mocked(getTraceGroup).mockResolvedValue(detail);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useTraceGroup('project-1', 'group-1', 'version-1'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toEqual(detail));
    expect(getTraceGroup).toHaveBeenCalledWith('project-1', 'version-1', 'group-1');
    expect(client.getQueryData(QUERY_KEYS.traces.detail('group-1'))).toEqual(detail);
  });

  it('does not load when project, version, or group id is missing', () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(
      ({ projectId, groupId, versionId }: { projectId: string; groupId: string | null; versionId: string }) =>
        useTraceGroup(projectId, groupId, versionId),
      {
        initialProps: {
          projectId: '',
          groupId: null as string | null,
          versionId: 'version-1',
        },
        wrapper,
      }
    );

    expect(getTraceGroup).not.toHaveBeenCalled();
    rerender({ projectId: 'project-1', groupId: null, versionId: 'version-1' });
    expect(getTraceGroup).not.toHaveBeenCalled();
    rerender({ projectId: 'project-1', groupId: 'group-1', versionId: '' });
    expect(getTraceGroup).not.toHaveBeenCalled();
  });
});