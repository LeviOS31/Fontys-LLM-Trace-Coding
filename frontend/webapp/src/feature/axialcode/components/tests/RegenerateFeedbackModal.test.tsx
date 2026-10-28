import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RegenerateFeedbackModal from '../RegenerateFeedbackModal';

describe('RegenerateFeedbackModal', () => {
  it('submits non-empty feedback as entered', () => {
    const onOpenChange = vi.fn();
    const onRegenerate = vi.fn();
    render(
      <RegenerateFeedbackModal
        open
        onOpenChange={onOpenChange}
        onRegenerate={onRegenerate}
        isPending={false}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/Split the largest category/), {
      target: { value: '  Separate overlapping themes  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    expect(onRegenerate).toHaveBeenCalledWith('  Separate overlapping themes  ');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('submits null for empty feedback, resets on cancel, and disables controls while pending', () => {
    const onOpenChange = vi.fn();
    const onRegenerate = vi.fn();
    const { rerender } = render(
      <RegenerateFeedbackModal
        open
        onOpenChange={onOpenChange}
        onRegenerate={onRegenerate}
        isPending={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(onRegenerate).toHaveBeenCalledWith(null);

    fireEvent.change(screen.getByPlaceholderText(/Split the largest category/), {
      target: { value: 'Discard this feedback' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByPlaceholderText(/Split the largest category/)).toHaveValue('');

    rerender(
      <RegenerateFeedbackModal
        open
        onOpenChange={onOpenChange}
        onRegenerate={onRegenerate}
        isPending
      />
    );
    expect(screen.getByPlaceholderText(/Split the largest category/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
  });
});
