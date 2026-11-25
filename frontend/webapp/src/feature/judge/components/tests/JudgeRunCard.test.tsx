import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDate, type JudgeRunListItem } from '../../hooks/judgeUtils';
import JudgeRunCard from '../JudgeRunCard';

afterEach(cleanup);

const run: JudgeRunListItem = {
  judgeRunId: 'run-1',
  judgeTemplateId: 'template-1',
  name: 'Template name',
  createdAt: '2025-01-15T12:00:00Z',
  totalCount: 3,
  trueCount: 2,
  falseCount: 1,
  failedCount: 0,
  feedback: null,
};

const renderCard = (
  overrides: Partial<JudgeRunListItem> = {},
  onSelect = vi.fn(),
  onDelete = vi.fn().mockResolvedValue(true),
  onFeedback?: (judgeRunId: string, feedback: string) => Promise<boolean>
) => {
  render(
    <Theme>
      <JudgeRunCard
        run={{ ...run, ...overrides }}
        onSelect={onSelect}
        onDelete={onDelete}
        onFeedback={onFeedback}
      />
    </Theme>
  );
  return { onSelect, onDelete };
};

describe('JudgeRunCard', () => {
  it('shows the run label, date, id and counts', () => {
    renderCard();
    expect(screen.getByText('Template name')).toBeInTheDocument();
    expect(screen.getByText(formatDate(run.createdAt))).toBeInTheDocument();
    expect(screen.getByText('run-1')).toBeInTheDocument();
    expect(screen.getByText('3 results')).toBeInTheDocument();
    expect(screen.getByText('2 true')).toBeInTheDocument();
    expect(screen.getByText('1 false')).toBeInTheDocument();
  });

  it('uses the singular "result" for a single result', () => {
    renderCard({ totalCount: 1, trueCount: 1, falseCount: 0 });
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('only shows the failed badge when there are failures', () => {
    const { unmount } = render(
      <Theme>
        <JudgeRunCard run={run} onSelect={vi.fn()} onDelete={vi.fn().mockResolvedValue(true)} />
      </Theme>
    );
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    unmount();

    renderCard({ failedCount: 2 });
    expect(screen.getByText('2 failed')).toBeInTheDocument();
  });

  it('calls onSelect with the run id when clicked', () => {
    const { onSelect } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Open Template name (run-1)' }));
    expect(onSelect).toHaveBeenCalledWith('run-1');
  });

  it('deletes the run from its card after confirmation', async () => {
    const { onDelete } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Template name (run-1)' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete run' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('run-1'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  describe('feedback', () => {
    it('has no Feedback button without onFeedback (evaluation mode)', () => {
      renderCard();
      expect(screen.queryByRole('button', { name: /feedback/i })).not.toBeInTheDocument();
    });

    it('shows a Feedback button with onFeedback (testing mode)', () => {
      renderCard({}, vi.fn(), vi.fn(), vi.fn());
      expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
    });

    it('marks runs that already have feedback', () => {
      renderCard({ feedback: 'Too strict' }, vi.fn(), vi.fn(), vi.fn());
      expect(screen.getByRole('button', { name: /Feedback ✓/ })).toBeInTheDocument();
    });

    it('opens the modal prefilled with the existing feedback', async () => {
      renderCard({ feedback: 'Too strict' }, vi.fn(), vi.fn(), vi.fn());
      fireEvent.click(screen.getByRole('button', { name: /Feedback ✓/ }));
      expect(await screen.findByRole('textbox')).toHaveValue('Too strict');
    });

    it('saves feedback for this run and closes the modal', async () => {
      const onFeedback = vi.fn().mockResolvedValue(true);
      renderCard({}, vi.fn(), vi.fn(), onFeedback);
      fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
      fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'Needs work' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(onFeedback).toHaveBeenCalledWith('run-1', 'Needs work'));
      await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    });

    it('does not open the run when the Feedback button is clicked', () => {
      const { onSelect } = renderCard({}, vi.fn(), vi.fn(), vi.fn());
      fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});