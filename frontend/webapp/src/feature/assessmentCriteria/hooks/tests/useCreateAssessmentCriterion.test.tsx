import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { createAssessmentCriterion } from '../../../../shared/api/assessmentCriteria';
import type { Project } from '../../../../shared/types/project';
import { useCreateAssessmentCriterion } from '../useCreateAssessmentCriterion';

vi.mock('../../../../shared/api/assessmentCriteria.ts', () => ({
  createAssessmentCriterion: vi.fn(),
}));

describe('useCreateAssessmentCriterion', () => {
  beforeEach(() => vi.mocked(createAssessmentCriterion).mockReset());

  it('creates a criterion, appends it to the project cache, and invalidates project detail', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const project: Project = {
      projectId: 'project-1',
      userId: 'user-1',
      name: 'Example',
      description: '',
      versions: [],
      assessmentCriteria: [{ criterionId: 'existing', criterion: 'Existing criterion' }],
    };
    client.setQueryData(QUERY_KEYS.projects.detail('project-1'), project);
    const created = {
      criterionId: 'new',
      projectId: 'project-1',
      criterion: 'New criterion',
    };
    vi.mocked(createAssessmentCriterion).mockResolvedValue(created);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateAssessmentCriterion('project-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('New criterion');
    });

    expect(createAssessmentCriterion).toHaveBeenCalledWith({
      projectId: 'project-1',
      criterion: 'New criterion',
    });
    expect(
      client.getQueryData<Project>(QUERY_KEYS.projects.detail('project-1'))?.assessmentCriteria
    ).toEqual([...project.assessmentCriteria, created]);
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.projects.detail('project-1'),
      })
    );
  });
});
