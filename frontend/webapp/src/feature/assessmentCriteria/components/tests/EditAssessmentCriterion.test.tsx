import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditAssessmentCriterion } from '../EditAssessmentCriterion';

const { updateCriterion, deleteCriterion } = vi.hoisted(() => ({
  updateCriterion: vi.fn(),
  deleteCriterion: vi.fn(),
}));

vi.mock('../../hooks/useUpdateAssessmentCriterion.ts', () => ({
  useUpdateAssessmentCriterion: () => ({ mutate: updateCriterion }),
}));
vi.mock('../../hooks/useDeleteAssessmentCriterion.ts', () => ({
  useDeleteAssessmentCriterion: () => ({ mutate: deleteCriterion }),
}));

describe('EditAssessmentCriterion', () => {
  it('trims and saves a changed criterion when the editor loses focus', () => {
    updateCriterion.mockReset();
    deleteCriterion.mockReset();
    const setIsEditing = vi.fn();
    render(
      <EditAssessmentCriterion
        criterionId="criterion-1"
        initialValue="Old value"
        setIsEditing={setIsEditing}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  New value  ' } });
    fireEvent.blur(input);

    expect(updateCriterion).toHaveBeenCalledWith({
      criterionId: 'criterion-1',
      criterion: 'New value',
    });
    expect(deleteCriterion).not.toHaveBeenCalled();
    expect(setIsEditing).toHaveBeenCalledWith(false);
  });

  it('deletes an empty criterion on blur and cancels editing with Escape', () => {
    updateCriterion.mockReset();
    deleteCriterion.mockReset();
    const setIsEditing = vi.fn();
    const { rerender } = render(
      <EditAssessmentCriterion
        criterionId="criterion-1"
        initialValue="Existing"
        setIsEditing={setIsEditing}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  ' } });
    fireEvent.blur(input);
    expect(deleteCriterion).toHaveBeenCalledWith('criterion-1');

    rerender(
      <EditAssessmentCriterion
        criterionId="criterion-1"
        initialValue="Existing"
        setIsEditing={setIsEditing}
      />
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(setIsEditing).toHaveBeenCalledWith(false);
  });

  it('does not issue an update when the value is unchanged', () => {
    updateCriterion.mockReset();
    const setIsEditing = vi.fn();
    render(
      <EditAssessmentCriterion
        criterionId="criterion-1"
        initialValue="Existing"
        setIsEditing={setIsEditing}
      />
    );

    fireEvent.blur(screen.getByRole('textbox'));

    expect(updateCriterion).not.toHaveBeenCalled();
    expect(setIsEditing).toHaveBeenCalledWith(false);
  });
});
