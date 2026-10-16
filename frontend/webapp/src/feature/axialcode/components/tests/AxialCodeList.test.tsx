import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Snapshot } from '../../../../shared/types/snapshot';
import AxialCodeList from '../AxialCodeList';

vi.mock('./AxialCodeCard/AxialCodeCard.tsx', () => ({
  default: ({ code, snap }: { code: { name: string }; snap: 'A' | 'B' }) => (
    <div data-testid="code-card">{`${snap}:${code.name}`}</div>
  ),
}));

const snapshot: Snapshot = {
  label: 'Version B',
  generatedAt: 'Oct 12, 2026',
  totals: {
    axialCodes: 2,
    traces: 5,
    openCodes: 8,
    avgTracesPerCode: 2.5,
    avgOpenCodesPerCode: 4,
    largestCategory: 'Reliability',
  },
  codes: [
    {
      id: 'code-1',
      name: 'Reliability',
      description: 'Failure patterns',
      prevalence: 60,
      traceCount: 3,
      openCodeCount: 4,
      traceIds: [],
      sampleTraces: [],
      sampleOpenCodes: [],
      color: '#123456',
    },
    {
      id: 'code-2',
      name: 'Clarity',
      description: 'Unclear responses',
      prevalence: 40,
      traceCount: 2,
      openCodeCount: 4,
      traceIds: [],
      sampleTraces: [],
      sampleOpenCodes: [],
      color: '#654321',
    },
  ],
};

describe('AxialCodeList', () => {
  it('renders all codes and the comparison label with count', () => {
    render(<AxialCodeList snapshot={snapshot} isB isComparison />);

    expect(screen.getByText('Version B · 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByTestId('code-card').map((node) => node.textContent)).toEqual([
      'B:Reliability',
      'B:Clarity',
    ]);
  });

  it('uses the A snapshot identity outside comparison mode', () => {
    render(<AxialCodeList snapshot={snapshot} />);

    expect(screen.queryByText(/Version B ·/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('code-card')[0]).toHaveTextContent('A:Reliability');
  });
});
