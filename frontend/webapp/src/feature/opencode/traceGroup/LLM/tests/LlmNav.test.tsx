import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LlmNav } from '../LlmNav';
import type { LlmMessage } from '../../TraceGroupPage';

const messages: LlmMessage[] = [
  {
    role: 'user',
    content: 'Question 1',
    index: 0,
    relatedTraceId: 'trace-1',
    relatedSpanId: 'span-1',
    modelName: 'model-a',
    amountOfSpans: 2,
  },
  {
    role: 'assistant',
    content: 'Answer 1',
    index: 1,
    relatedTraceId: 'trace-1',
    relatedSpanId: 'span-1',
    modelName: 'model-a',
    amountOfSpans: 2,
  },
  {
    role: 'assistant',
    content: 'Answer 2',
    index: 0,
    relatedTraceId: 'trace-2',
    relatedSpanId: 'span-2',
  },
];

describe('LlmNav', () => {
  it('shows one navigation entry per trace and selects the clicked trace', () => {
    const setSelectedTrace = vi.fn();
    render(
      <LlmNav
        llmMessages={messages}
        scrollTraceId="trace-1"
        selectedTraceId="trace-2"
        setSelectedTrace={setSelectedTrace}
      />
    );

    expect(screen.getAllByText('model-a')).toHaveLength(1);
    expect(screen.getByText('UNKNOWN MODEL')).toBeInTheDocument();
    fireEvent.click(screen.getByText('model-a'));
    expect(setSelectedTrace).toHaveBeenCalledWith('trace-1');
  });
});
