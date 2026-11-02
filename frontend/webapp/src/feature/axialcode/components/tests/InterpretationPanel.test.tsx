import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AxialCode } from '../../../../shared/types/axialCode';
import type { Snapshot } from '../../../../shared/types/snapshot';
import type { AxialCodeComparison } from '../../../../shared/util/compareAxialCodes';
import InterpretationPanel from '../InterpretationPanel/InterpretationPanel';

const { mutate, useGenerate } = vi.hoisted(() => ({
  mutate: vi.fn(),
  useGenerate: vi.fn(),
}));

vi.mock('../../hooks/useGenerateAxialCodingResult.ts', () => ({
  useGenerateAxialCodingResults: useGenerate,
}));

const snapshot = (label: string, axialCodes: number): Snapshot => ({
  label,
  generatedAt: 'Oct 12, 2026',
  totals: {
    axialCodes,
    traces: 4,
    openCodes: 8,
    avgTracesPerCode: 2,
    avgOpenCodesPerCode: 2,
    largestCategory: 'Reliability',
  },
  codes: [],
});

const previousCodes: AxialCode[] = [
  { label: 'Reliability', description: 'Failures', traceIds: ['trace-1'] },
];

function renderPanel(overrides: Partial<React.ComponentProps<typeof InterpretationPanel>> = {}) {
  return render(
    <InterpretationPanel
      snapshotA={snapshot('Version A', 1)}
      snapshotB={snapshot('Version B', 2)}
      userFeedback="Separate overlapping themes"
      projectId="project-1"
      projectVersionId="version-1"
      axialCodesForRegen={previousCodes}
      onRegenerated={vi.fn()}
      onApprove={vi.fn()}
      onDiscard={vi.fn()}
      isSaving={false}
      comparison={null as AxialCodeComparison | null}
      {...overrides}
    />
  );
}

describe('InterpretationPanel', () => {
  it('shows feedback and disables approval actions while saving', () => {
    useGenerate.mockReturnValue({ mutate, isPending: false });
    renderPanel({ isSaving: true });

    expect(screen.getByText('Regenerated based on your feedback')).toBeInTheDocument();
    expect(screen.getByText('"Separate overlapping themes"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Regenerate/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Discard/ })).toBeDisabled();
  });

  it('opens feedback, regenerates with the prior codes, and reports the new result', () => {
    mutate.mockReset();
    mutate.mockImplementation((_payload, callbacks) => {
      callbacks?.onSuccess?.({
        axialCodingResultId: 'result-2',
        axialCodes: previousCodes,
      });
    });
    useGenerate.mockReturnValue({ mutate, isPending: false });
    const onRegenerated = vi.fn();
    renderPanel({ onRegenerated });

    fireEvent.click(screen.getByRole('button', { name: /^Regenerate/ }));
    fireEvent.change(screen.getByPlaceholderText(/Split the largest category/), {
      target: { value: 'Preserve the original categories' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    expect(mutate).toHaveBeenCalledWith(
      { feedback: 'Preserve the original categories', axialCodes: previousCodes },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(onRegenerated).toHaveBeenCalledWith({
      axialCodingResultId: 'result-2',
      axialCodes: previousCodes,
      feedback: 'Preserve the original categories',
    });
  });

  it('forwards approve and discard actions', () => {
    useGenerate.mockReturnValue({ mutate, isPending: false });
    const onApprove = vi.fn();
    const onDiscard = vi.fn();
    renderPanel({ onApprove, onDiscard });

    fireEvent.click(screen.getByRole('button', { name: 'Approve Version B' }));
    fireEvent.click(screen.getByRole('button', { name: /Discard/ }));

    expect(onApprove).toHaveBeenCalledOnce();
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
