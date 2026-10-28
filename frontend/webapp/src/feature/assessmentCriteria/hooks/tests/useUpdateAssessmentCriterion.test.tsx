import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { updateAssessmentCriterion } from '../../../../shared/api/assessmentCriteria';
import type { Project } from '../../../../shared/types/project';
import { useUpdateAssessmentCriterion } from '../useUpdateAssessmentCriterion';

vi.mock('../../../../shared/api/assessmentCriteria.ts', () => ({
  updateAssessmentCriterion: vi.fn(),
}));

describe('useUpdateAssessmentCriterion', () => {
  beforeEach(() => vi.mocked(updateAssessmentCriterion).mockReset());

  it('updates the matching criterion in the project cache using the route project ID', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const project: Project = {
      projectId: 'project-1',
      userId: 'user-1',
      name: 'Example',
      description: '',
      versions: [],
      assessmentCriteria: [
        { criterionId: 'criterion-1', criterion: 'Old wording' },
        { criterionId: 'criterion-2', criterion: 'Leave unchanged' },
      ],
    };
    client.setQueryData(QUERY_KEYS.projects.detail('project-1'), project);
    const updated = {
      criterionId: 'criterion-1',
      projectId: 'project-1',
      criterion: 'Updated wording',
    };
    vi.mocked(updateAssessmentCriterion).mockResolvedValue(updated);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/projects/project-1']}>
        <Routes>
          <Route
            path="/projects/:id"
            element={<QueryClientProvider client={client}>{children}</QueryClientProvider>}
          />
        </Routes>
      </MemoryRouter>
    );
    const { result } = renderHook(() => useUpdateAssessmentCriterion(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        criterionId: 'criterion-1',
        criterion: 'Updated wording',
      });
    });

    expect(updateAssessmentCriterion).toHaveBeenCalledWith({
      projectId: 'project-1',
      criterionId: 'criterion-1',
      criterion: 'Updated wording',
    });
    await waitFor(() =>
      expect(
        client.getQueryData<Project>(QUERY_KEYS.projects.detail('project-1'))?.assessmentCriteria
      ).toEqual([updated, project.assessmentCriteria[1]])
    );
  });
});
