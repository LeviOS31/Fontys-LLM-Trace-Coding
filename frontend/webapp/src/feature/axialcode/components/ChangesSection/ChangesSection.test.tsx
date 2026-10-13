import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AxialCode } from '../../../../shared/types/axialCode';
import { compareAxialCodes } from '../../../../shared/util/compareAxialCodes';
import ChangesSection from './ChangesSection';

const previousCodes: AxialCode[] = [
  {
    label: 'Hallucinated policies',
    description: 'Invented policy details',
    traceIds: ['trace-1', 'trace-2'],
  },
];
const nextCodes: AxialCode[] = [
  {
    label: 'Invented refund rules',
    description: 'Makes up refund conditions',
    traceIds: ['trace-1', 'trace-2'],
  },
];
const comparison = compareAxialCodes(previousCodes, nextCodes);

describe('ChangesSection', () => {
  it('renders the change summary and expands a row to show code and open-code details', () => {
    render(
      <ChangesSection
        comparison={comparison}
        previousCodes={previousCodes}
        nextCodes={nextCodes}
        colorOf={new Map()}
        openCodeTextById={{ 'trace-1': 'Invented a warranty term', 'trace-2': 'Made up a refund' }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Changes' })).toBeInTheDocument();
    expect(screen.getByText('Hallucinated policies')).toBeInTheDocument();
    expect(screen.getByText('Invented refund rules')).toBeInTheDocument();
    expect(screen.getByText(/was renamed to/)).toBeInTheDocument();

    const rowHeader = screen.getByRole('button', { name: /Renamed Hallucinated policies/ });
    fireEvent.click(rowHeader);
    expect(screen.getByText('Invented a warranty term')).toBeInTheDocument();
    expect(screen.getByText('Made up a refund')).toBeInTheDocument();

    fireEvent.click(rowHeader);
    expect(screen.queryByText('Invented a warranty term')).not.toBeInTheDocument();
  });
});
