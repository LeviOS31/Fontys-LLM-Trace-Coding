import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SectionHead, SummaryStat } from '../Primitives';

afterEach(cleanup);

describe('SectionHead', () => {
  it('renders the title as a heading', () => {
    render(
      <Theme>
        <SectionHead title="Overview" />
      </Theme>
    );
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });

  it('renders the subtitle only when provided', () => {
    const { rerender } = render(
      <Theme>
        <SectionHead title="Overview" />
      </Theme>
    );
    expect(screen.queryByText('Some subtitle')).not.toBeInTheDocument();

    rerender(
      <Theme>
        <SectionHead title="Overview" subtitle="Some subtitle" />
      </Theme>
    );
    expect(screen.getByText('Some subtitle')).toBeInTheDocument();
  });
});

describe('SummaryStat', () => {
  it('renders the label and a string value', () => {
    render(
      <Theme>
        <SummaryStat label="Verdict true" value="6 (60.0%)" />
      </Theme>
    );
    expect(screen.getByText('Verdict true')).toBeInTheDocument();
    expect(screen.getByText('6 (60.0%)')).toBeInTheDocument();
  });

  it('renders a numeric value, including zero', () => {
    render(
      <Theme>
        <SummaryStat label="Failed" value={0} />
      </Theme>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
