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
};

const renderCard = (
  overrides: Partial<JudgeRunListItem> = {},
  onSelect = vi.fn(),
  onDelete = vi.fn().mockResolvedValue(true)
) => {
  render(
    <Theme>
      <JudgeRunCard run={{ ...run, ...overrides }} onSelect={onSelect} onDelete={onDelete} />
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
});
