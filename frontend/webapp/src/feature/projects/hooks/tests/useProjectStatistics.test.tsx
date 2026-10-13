import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectStatistics } from '../../../../shared/api/statistics';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { ProjectStatistics } from '../../../../shared/types/statistics.dto';
import { useProjectStatistics } from '../useProjectStatistics';

vi.mock('../../../../shared/api/statistics.ts', () => ({
  getProjectStatistics: vi.fn(),
}));

describe('useProjectStatistics', () => {
  beforeEach(() => vi.mocked(getProjectStatistics).mockReset());

  it('fetches and caches project statistics by project id', async () => {
    const client = new QueryClient();
    const statistics: ProjectStatistics = {
      totalTraceCount: 7,
      versionTotalTraceCount: { First: 7 },
      totalOpenCodeCount: 8,
      totalAxialCodeCount: 2,
      versionAxialCodes: {},
    };
    vi.mocked(getProjectStatistics).mockResolvedValue(statistics);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useProjectStatistics('project-1'), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(statistics));
    expect(getProjectStatistics).toHaveBeenCalledWith('project-1');
    expect(client.getQueryData(QUERY_KEYS.statistics.project('project-1'))).toEqual(statistics);
  });
});