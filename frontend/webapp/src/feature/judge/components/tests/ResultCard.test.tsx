import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JudgeResult } from '../../hooks/judgeUtils';
import ResultCard from '../ResultCard';

afterEach(cleanup);

const base: JudgeResult = {
  traceId: 'trace-1',
  status: 'success',
  verdict: 'true',
  reasoning: 'The trace satisfies the criterion.',
  error: null,
  judgingTrace: true,
};

const renderCard = (overrides: Partial<JudgeResult> = {}, onOpen = vi.fn()) => {
  render(
    <Theme>
      <ResultCard result={{ ...base, ...overrides }} onOpen={onOpen} />
    </Theme>
  );
  return onOpen;
};

describe('ResultCard', () => {
  it('shows the trace id, verdict, status and reasoning', () => {
    renderCard();
    expect(screen.getByText('trace-1')).toBeInTheDocument();
    expect(screen.getByText('Verdict: true')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('The trace satisfies the criterion.')).toBeInTheDocument();
  });

  it('opens the trace content when the result card is clicked', () => {
    const onOpen = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'View LLM content for trace trace-1' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('colours a true, successful verdict green', () => {
    renderCard();
    expect(screen.getByText('Verdict: true')).toHaveAttribute('data-accent-color', 'green');
    expect(screen.getByText('success')).toHaveAttribute('data-accent-color', 'green');
  });

  it('colours a false verdict red while the status stays green', () => {
    renderCard({ verdict: 'false' });
    expect(screen.getByText('Verdict: false')).toHaveAttribute('data-accent-color', 'red');
    expect(screen.getByText('success')).toHaveAttribute('data-accent-color', 'green');
  });

  it('shows a dash, the error and a red status for a failed trace', () => {
    renderCard({
      status: 'failed',
      verdict: null,
      reasoning: null,
      error: 'Model timed out',
    });
    expect(screen.getByText('Verdict: –')).toHaveAttribute('data-accent-color', 'red');
    expect(screen.getByText('failed')).toHaveAttribute('data-accent-color', 'red');
    expect(screen.getByText('Model timed out')).toBeInTheDocument();
  });

  it('omits the reasoning and error sections when they are empty', () => {
    renderCard({ reasoning: null, error: null });
    expect(screen.queryByText('The trace satisfies the criterion.')).not.toBeInTheDocument();
    expect(screen.queryByText('Model timed out')).not.toBeInTheDocument();
  });
});
