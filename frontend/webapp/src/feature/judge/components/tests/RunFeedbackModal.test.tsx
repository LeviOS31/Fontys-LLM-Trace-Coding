import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import RunFeedbackModal from '../RunFeedbackModal';

function setup(overrides: Partial<Parameters<typeof RunFeedbackModal>[0]> = {}) {
  const props = {
    title: 'Correctness of refusal',
    initial: '',
    onSave: vi.fn().mockResolvedValue(true),
    onClose: vi.fn(),
    ...overrides,
  };
  render(
    <Theme>
      <RunFeedbackModal {...props} />
    </Theme>
  );
  return props;
}

const saveButton = () => screen.getByRole('button', { name: /save/i }) as HTMLButtonElement;
const textbox = () => screen.getByRole('textbox') as HTMLTextAreaElement;

describe('RunFeedbackModal', () => {
  it('shows the run title and the existing feedback', () => {
    setup({ initial: 'Too strict' });
    expect(screen.getByText(/Correctness of refusal/)).toBeTruthy();
    expect(textbox().value).toBe('Too strict');
  });

  it('keeps Save disabled until the text changes', () => {
    setup({ initial: 'Too strict' });
    expect(saveButton().disabled).toBe(true);

    fireEvent.change(textbox(), { target: { value: 'Too strict on apologies' } });
    expect(saveButton().disabled).toBe(false);
  });

  it('saves the trimmed text and closes on success', async () => {
    const { onSave, onClose } = setup();
    fireEvent.change(textbox(), { target: { value: '  Good, but slow  ' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith('Good, but slow');
  });

  it('shows an error and stays open when saving fails', async () => {
    const { onClose } = setup({ onSave: vi.fn().mockResolvedValue(false) });
    fireEvent.change(textbox(), { target: { value: 'Note' } });
    fireEvent.click(saveButton());

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    const { onClose, onSave } = setup();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});