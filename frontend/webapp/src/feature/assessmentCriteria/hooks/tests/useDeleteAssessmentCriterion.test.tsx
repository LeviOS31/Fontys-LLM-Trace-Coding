import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAssessmentCriterion } from '../../../../shared/api/assessmentCriteria';
import { useDeleteAssessmentCriterion } from '../useDeleteAssessmentCriterion';

vi.mock('../../../../shared/api/assessmentCriteria.ts', () => ({
  deleteAssessmentCriterion: vi.fn(),
}));

describe('useDeleteAssessmentCriterion', () => {
  beforeEach(() => vi.mocked(deleteAssessmentCriterion).mockReset());

  it('sends the requested criterion to the API', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    vi.mocked(deleteAssessmentCriterion).mockResolvedValue(undefined);
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
    const { result } = renderHook(() => useDeleteAssessmentCriterion(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('criterion-1');
    });

    expect(deleteAssessmentCriterion).toHaveBeenCalledWith({
      projectId: 'project-1',
      criterionId: 'criterion-1',
    });
  });
});
