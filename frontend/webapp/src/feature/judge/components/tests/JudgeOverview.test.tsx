import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JudgeRunListItem, JudgeRunTotals } from '../../hooks/judgeUtils';
import JudgeOverview from '../JudgeOverview';

afterEach(cleanup);

const makeRun = (id: string, templateName: string): JudgeRunListItem => ({
  judgeRunId: id,
  axialCodeId: `axial-${id}`,
  createdAt: '2025-01-15T12:00:00Z',
  templateName,
  totalCount: 5,
  trueCount: 3,
  falseCount: 2,
  failedCount: 0,
});

const totals: JudgeRunTotals = {
  runs: 4,
  totalCount: 10,
  trueCount: 6,
  falseCount: 3,
  failedCount: 1,
};

type Overrides = Partial<React.ComponentProps<typeof JudgeOverview>>;

function renderOverview(overrides: Overrides = {}) {
  const props = {
    runs: [makeRun('run-1', 'Reliability'), makeRun('run-2', 'Latency')],
    totals,
    hasMore: false,
    loading: false,
    onLoadMore: vi.fn(),
    onSelect: vi.fn(),
    ...overrides,
  };
  render(
    <Theme>
      <JudgeOverview {...props} />
    </Theme>
  );
  return props;
}

// Stat labels are <p> elements; section titles are headings, so filter on the tag.
function statValue(label: string) {
  const el = screen.getAllByText(label).find((node) => node.tagName === 'P');
  return el?.nextElementSibling?.textContent;
}

describe('JudgeOverview', () => {
  it('shows aggregate statistics from the totals', () => {
    renderOverview();
    expect(statValue('Judge runs')).toBe('4');
    expect(statValue('Traces judged')).toBe('10');
    expect(statValue('Verdict true')).toBe('6 (60.0%)');
    expect(statValue('Verdict false')).toBe('3 (30.0%)');
    expect(statValue('Failed')).toBe('1');
  });

  it('shows dashes for the rates when no traces were judged', () => {
    renderOverview({
      runs: [],
      totals: { runs: 0, totalCount: 0, trueCount: 0, falseCount: 0, failedCount: 0 },
    });
    expect(statValue('Verdict true')).toBe('0 (–)');
    expect(statValue('Verdict false')).toBe('0 (–)');
  });

  it('renders one card per run and forwards selection', () => {
    const { onSelect } = renderOverview();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Latency/ }));
    expect(onSelect).toHaveBeenCalledWith('run-2');
  });

  it('shows an empty-state message when there are no runs', () => {
    renderOverview({ runs: [] });
    expect(screen.getByText(/No judge runs yet/)).toBeInTheDocument();
  });

  it('shows a loading message instead while the first page loads', () => {
    renderOverview({ runs: [], loading: true });
    expect(screen.getByText('Loading judge runs…')).toBeInTheDocument();
    expect(screen.queryByText(/No judge runs yet/)).not.toBeInTheDocument();
  });

  it('does not show a load-more button when everything is loaded', () => {
    renderOverview({ hasMore: false });
    expect(screen.queryByRole('button', { name: /Load more/ })).not.toBeInTheDocument();
  });

  it('shows a load-more button with progress and calls onLoadMore', () => {
    const { onLoadMore } = renderOverview({ hasMore: true });
    const button = screen.getByRole('button', { name: 'Load more (2 of 4)' });
    fireEvent.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('disables the load-more button while loading', () => {
    renderOverview({ hasMore: true, loading: true });
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  });
});
