import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJudgeTemplateVersions } from '../../../../shared/api/judgeTemplates';
import { useGetJudgeTemplateVersions } from '../useGetJudgeTemplateVersions';

vi.mock('../../../../shared/api/judgeTemplates.ts', () => ({
  getJudgeTemplateVersions: vi.fn(),
}));

describe('useGetJudgeTemplateVersions', () => {
  beforeEach(() => vi.mocked(getJudgeTemplateVersions).mockReset());

  it('fetches the history for the specified template', async () => {
    const queryClient = new QueryClient();
    const data = { versions: [] };
    vi.mocked(getJudgeTemplateVersions).mockResolvedValue(data);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useGetJudgeTemplateVersions('project-1', 'version-1', 'template-1', true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(getJudgeTemplateVersions).toHaveBeenCalledWith(
      'project-1',
      'version-1',
      'template-1'
    );
  });

  it('does not fetch while disabled', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(
      () => useGetJudgeTemplateVersions('project-1', 'version-1', 'template-1', false),
      { wrapper }
    );

    expect(getJudgeTemplateVersions).not.toHaveBeenCalled();
  });
});