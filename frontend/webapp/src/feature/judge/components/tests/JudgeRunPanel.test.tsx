import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JudgeTemplate, RunError } from '../../hooks/judgeUtils';
import RunJudgePanel from '../JudgeRunPanel';

vi.mock('../JudgeTemplateSelect.tsx', () => ({
  default: ({ onChange }: { onChange: (ids: string[]) => void }) => (
    <button type="button" onClick={() => onChange(['t1', 't2'])}>
      Pick templates
    </button>
  ),
}));

afterEach(cleanup);

const templates: JudgeTemplate[] = [
  { id: 't1', axialCodeId: 'a1', name: 'Reliability', isDeprecated: false },
];

type Overrides = Partial<React.ComponentProps<typeof RunJudgePanel>>;

function renderPanel(overrides: Overrides = {}) {
  const props = {
    templates,
    onTemplateChange: vi.fn(),
    onRun: vi.fn(),
    canRun: true,
    loading: false,
    error: null as RunError | null,
    ...overrides,
  };
  const view = render(
    <Theme>
      <RunJudgePanel {...props} />
    </Theme>
  );
  return { ...props, ...view };
}

describe('RunJudgePanel', () => {
  it('forwards template changes from the selector', () => {
    const { onTemplateChange } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Pick templates' }));
    expect(onTemplateChange).toHaveBeenCalledWith(['t1', 't2']);
  });

  it('runs the judge when the form is submitted and running is allowed', () => {
    const { onRun } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Run judge' }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('disables the run button and ignores submits when running is not allowed', () => {
    const { onRun, container } = renderPanel({ canRun: false });
    expect(screen.getByRole('button', { name: 'Run judge' })).toBeDisabled();
    fireEvent.submit(container.querySelector('form')!);
    expect(onRun).not.toHaveBeenCalled();
  });

  it('shows the running label while loading', () => {
    renderPanel({ loading: true, canRun: false });
    expect(screen.getByRole('button', { name: 'Running judge' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Run judge' })).not.toBeInTheDocument();
  });

  it('does not render an error callout without an error', () => {
    renderPanel();
    expect(screen.queryByText('Request failed (500).')).not.toBeInTheDocument();
  });

  it('shows the error message and the raw response', () => {
    renderPanel({ error: { message: 'Request failed (500).', raw: '{"detail":"boom"}' } });
    expect(screen.getByText('Request failed (500).')).toBeInTheDocument();
    expect(screen.getByText('{"detail":"boom"}')).toBeInTheDocument();
  });
});
