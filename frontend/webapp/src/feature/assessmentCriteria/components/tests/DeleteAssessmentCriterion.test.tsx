import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeleteAssessmentCriterion } from '../DeleteAssessmentCriterion';

const { deleteCriterion } = vi.hoisted(() => ({ deleteCriterion: vi.fn() }));

vi.mock('../../hooks/useDeleteAssessmentCriterion.ts', () => ({
  useDeleteAssessmentCriterion: () => ({ mutate: deleteCriterion }),
}));

afterEach(() => {
  vi.useRealTimers();
});

describe('DeleteAssessmentCriterion', () => {
  it('asks for confirmation before deleting the selected criterion', () => {
    deleteCriterion.mockReset();
    render(<DeleteAssessmentCriterion criterionId="criterion-1" />);

    fireEvent.click(screen.getByTestId('assessment-criterion-delete'));
    fireEvent.click(screen.getByTestId('assessment-criterion-delete-confirm'));

    expect(deleteCriterion).toHaveBeenCalledWith('criterion-1');
  });

  it('hides the confirmation button after three seconds', () => {
    vi.useFakeTimers();
    render(<DeleteAssessmentCriterion criterionId="criterion-1" />);
    fireEvent.click(screen.getByTestId('assessment-criterion-delete'));
    expect(screen.getByTestId('assessment-criterion-delete-confirm')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByTestId('assessment-criterion-delete-confirm')).not.toBeInTheDocument();
    expect(screen.getByTestId('assessment-criterion-delete')).toBeInTheDocument();
  });
});
