import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JudgeResult, JudgeRunListItem } from '../../hooks/judgeUtils';
import JudgeRunDetails from '../JudgeRunDetails';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

const results: JudgeResult[] = [
  {
    traceId: 'trace-1',
    status: 'success',
    verdict: 'true',
    reasoning: 'Looks right',
    error: null,
  },
  {
    traceId: 'trace-2',
    status: 'failed',
    verdict: null,
    reasoning: null,
    error: 'Timeout',
  },
];

type Overrides = Partial<React.ComponentProps<typeof JudgeRunDetails>>;

function renderDetails(overrides: Overrides = {}) {
  const props = {
    run,
    results,
    resultsLoading: false,
    onBack: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(
    <Theme>
      <JudgeRunDetails {...props} />
    </Theme>
  );
  return props;
}

// "Results" is both a stat label (<p>) and a section heading, so filter on the tag.
function statValue(label: string) {
  const el = screen.getAllByText(label).find((node) => node.tagName === 'P');
  return el?.nextElementSibling?.textContent;
}

describe('JudgeRunDetails', () => {
  it('shows the template name, run id and summary statistics', () => {
    renderDetails();
    expect(screen.getByText('Reliability')).toBeInTheDocument();
    expect(screen.getByText('run-1')).toBeInTheDocument();
    expect(statValue('Results')).toBe('3');
    expect(statValue('Verdict true')).toBe('2 (66.7%)');
    expect(statValue('Verdict false')).toBe('1 (33.3%)');
    expect(statValue('Failed')).toBe('0');
  });

  it('renders one card per result in the formatted view', () => {
    renderDetails();
    expect(screen.getByText('trace-1')).toBeInTheDocument();
    expect(screen.getByText('trace-2')).toBeInTheDocument();
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });

  it('shows a loading message while results are null', () => {
    renderDetails({ results: null });
    expect(screen.getByText('Loading results…')).toBeInTheDocument();
  });

  it('shows a loading message while results are being fetched', () => {
    renderDetails({ resultsLoading: true });
    expect(screen.getByText('Loading results…')).toBeInTheDocument();
    expect(screen.queryByText('trace-1')).not.toBeInTheDocument();
  });

  it('shows an empty message when the judge returned no results', () => {
    renderDetails({ results: [] });
    expect(
      screen.getByText('The judge returned no results for this axial code.')
    ).toBeInTheDocument();
  });

  it('switches to the raw JSON view', () => {
    renderDetails();
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    expect(screen.getByText(/"judgeRunId": "run-1"/)).toBeInTheDocument();
    expect(screen.queryByText('Looks right')).not.toBeInTheDocument();
  });

  it('calls onBack from the back button', () => {
    const { onBack } = renderDetails();
    fireEvent.click(screen.getByRole('button', { name: /All judge runs/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('delete', () => {
    it('calls onDelete after the user confirms', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
      const { onDelete } = renderDetails();
      fireEvent.click(screen.getByRole('button', { name: /Delete run/ }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the user cancels', () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
      const { onDelete } = renderDetails();
      fireEvent.click(screen.getByRole('button', { name: /Delete run/ }));
      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('copy', () => {
    it('is disabled until results are available', () => {
      renderDetails({ results: null });
      expect(screen.getByRole('button', { name: /Copy/ })).toBeDisabled();
    });

    it('copies the raw JSON and shows a confirmation', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      renderDetails();

      fireEvent.click(screen.getByRole('button', { name: /Copy/ }));

      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith(
          JSON.stringify({ judgeRunId: 'run-1', results }, null, 2)
        )
      );
      expect(await screen.findByRole('button', { name: /Copied/ })).toBeInTheDocument();
    });

    it('does not show a confirmation when the clipboard is unavailable', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      renderDetails();

      fireEvent.click(screen.getByRole('button', { name: /Copy/ }));

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: /Copied/ })).not.toBeInTheDocument();
    });
  });
});
