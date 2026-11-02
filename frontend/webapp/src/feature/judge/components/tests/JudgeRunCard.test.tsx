import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDate, type JudgeRunListItem } from '../../hooks/judgeUtils';
import JudgeRunCard from '../JudgeRunCard';

afterEach(cleanup);

const run: JudgeRunListItem = {
  judgeRunId: 'run-1',
  axialCodeId: 'a1',
  createdAt: '2025-01-15T12:00:00Z',
  templateName: 'Reliability',
  totalCount: 3,
  trueCount: 2,
  falseCount: 1,
  failedCount: 0,
};

const renderCard = (overrides: Partial<JudgeRunListItem> = {}, onSelect = vi.fn()) => {
  render(
    <Theme>
      <JudgeRunCard run={{ ...run, ...overrides }} onSelect={onSelect} />
    </Theme>
  );
  return onSelect;
};

describe('JudgeRunCard', () => {
  it('shows the template name, date, id and counts', () => {
    renderCard();
    expect(screen.getByText('Reliability')).toBeInTheDocument();
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
        <JudgeRunCard run={run} onSelect={vi.fn()} />
      </Theme>
    );
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    unmount();

    renderCard({ failedCount: 2 });
    expect(screen.getByText('2 failed')).toBeInTheDocument();
  });

  it('calls onSelect with the run id when clicked', () => {
    const onSelect = renderCard();
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('run-1');
  });
});
