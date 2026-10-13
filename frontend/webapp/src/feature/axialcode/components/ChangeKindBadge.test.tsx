import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChangeKindBadge from './ChangeKindBadge';

describe('ChangeKindBadge', () => {
  it('shows a change label and optional count', () => {
    const { rerender } = render(<ChangeKindBadge kind="renamed" />);
    expect(screen.getByTestId('axial-code-change')).toHaveTextContent('Renamed');

    rerender(<ChangeKindBadge kind="removed" count={2} />);
    expect(screen.getByTestId('axial-code-change')).toHaveTextContent('2 removed');
  });
});
