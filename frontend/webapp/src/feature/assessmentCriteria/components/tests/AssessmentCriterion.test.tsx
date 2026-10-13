import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssessmentCriterion } from '../AssessmentCriterion';

vi.mock('../../hooks/useUpdateAssessmentCriterion.ts', () => ({
  useUpdateAssessmentCriterion: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../hooks/useDeleteAssessmentCriterion.ts', () => ({
  useDeleteAssessmentCriterion: () => ({ mutate: vi.fn() }),
}));

describe('AssessmentCriterion', () => {
  it('shows the criterion and switches to an editor when its text is clicked', () => {
    render(
      <AssessmentCriterion criterion={{ criterionId: 'criterion-1', criterion: 'Clarity' }} />
    );

    fireEvent.click(screen.getByTestId('assessment-criterion-text'));

    expect(screen.getByRole('textbox')).toHaveValue('Clarity');
    expect(screen.getByTestId('assessment-criterion-delete')).toBeInTheDocument();
  });
});
