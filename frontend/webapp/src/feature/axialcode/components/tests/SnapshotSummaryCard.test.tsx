import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../../../../shared/types/snapshot';
import SnapshotSummaryCard from '../SnapshotSummaryCard';

const snapshot: Snapshot = {
  label: 'Version B',
  generatedAt: 'Oct 12, 2026',
  totals: {
    axialCodes: 3,
    traces: 8,
    openCodes: 12,
    avgTracesPerCode: 2.7,
    avgOpenCodesPerCode: 4,
    largestCategory: 'Hallucinations',
  },
  codes: [],
};

describe('SnapshotSummaryCard', () => {
  it('renders totals and the generated date', () => {
    render(<SnapshotSummaryCard snapshot={snapshot} />);

    expect(screen.getByText('Version Date: Oct 12, 2026')).toBeInTheDocument();
    expect(screen.getByText('Axial codes')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Open codes')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Avg open codes / code')).toBeInTheDocument();
    expect(screen.getByText('Hallucinations')).toBeInTheDocument();
  });

  it('labels snapshots in a comparison view', () => {
    render(<SnapshotSummaryCard snapshot={snapshot} isB isComparison />);

    expect(screen.getByText('Version B · Oct 12, 2026')).toBeInTheDocument();
  });
});
