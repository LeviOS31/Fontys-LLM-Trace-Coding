import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateAssessmentCriterion } from '../CreateAssessmentCriterion';

const { createCriterion, isPending } = vi.hoisted(() => ({
  createCriterion: vi.fn(),
  isPending: { value: false },
}));

vi.mock('../../hooks/useCreateAssessmentCriterion.ts', () => ({
  useCreateAssessmentCriterion: () => ({
    mutate: createCriterion,
    get isPending() {
      return isPending.value;
    },
  }),
}));

vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('CreateAssessmentCriterion', () => {
  it('requires non-whitespace criterion text and creates on button click', () => {
    createCriterion.mockReset();
    createCriterion.mockImplementation((_value, options) => options.onSuccess());
    render(<CreateAssessmentCriterion projectId="project-1" />);

    const input = screen.getByPlaceholderText('Add new assessment criterion');
    const submit = screen.getByTestId('assessment-criterion-create-button');
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: '  ' } });
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: '  Clarity  ' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(createCriterion).toHaveBeenCalledWith('Clarity', expect.any(Object));
    expect(input).toHaveValue('');
  });

  it('creates on Enter and disables submission while pending', () => {
    createCriterion.mockReset();
    isPending.value = false;
    const { rerender } = render(<CreateAssessmentCriterion projectId="project-1" />);
    const input = screen.getByPlaceholderText('Add new assessment criterion');
    fireEvent.change(input, { target: { value: 'Useful context' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(createCriterion).toHaveBeenCalledWith('Useful context', expect.any(Object));

    isPending.value = true;
    rerender(<CreateAssessmentCriterion projectId="project-1" />);
    expect(screen.getByPlaceholderText('Add new assessment criterion')).toBeDisabled();
    expect(screen.getByTestId('assessment-criterion-create-button')).toBeDisabled();
  });
});
