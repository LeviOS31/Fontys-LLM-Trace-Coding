import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getJudgeTemplates } from '../../../../shared/api/judgeTemplates';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { useGetJudgeTemplates } from '../useGetJudgeTemplates';

vi.mock('../../../../shared/api/judgeTemplates.ts', () => ({
  getJudgeTemplates: vi.fn(),
}));

describe('useGetJudgeTemplates', () => {
  it('loads templates for the project version with the expected query key', async () => {
    const queryClient = new QueryClient();
    const templates = { judgeTemplates: [] };
    vi.mocked(getJudgeTemplates).mockResolvedValue(templates);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useGetJudgeTemplates('project-1', 'version-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(templates));
    expect(getJudgeTemplates).toHaveBeenCalledWith('project-1', 'version-1');
    expect(queryClient.getQueryData(QUERY_KEYS.judgeTemplates.byVersion('version-1'))).toEqual(
      templates
    );
  });
});