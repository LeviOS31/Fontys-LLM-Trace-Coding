import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSpan, createTrace, stringAttribute } from './traceFixtures';
import { TraceTreeNav } from '../TraceTreeNav';

vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('TraceTreeNav', () => {
  it('shows message nodes and routes selection back to the conversation', () => {
    const chatSpan = createSpan('chat-span', 'chat completion', {
      attributes: [
        stringAttribute(
          'gen_ai.input.messages',
          JSON.stringify([{ role: 'user', content: 'What is in this source?' }])
        ),
        stringAttribute('gen_ai.request.model', 'test-model'),
      ],
    });
    const trace = createTrace([chatSpan]);
    const setSelectedTrace = vi.fn();
    const setSelectedSpan = vi.fn();
    const requestChatScroll = vi.fn();
    const setSelectedNodeKey = vi.fn();

    render(
      <TraceTreeNav
        trace={trace}
        selectedSpanId={null}
        setSelectedTrace={setSelectedTrace}
        setSelectedSpan={setSelectedSpan}
        requestChatScroll={requestChatScroll}
        messageAnchors={[
          {
            relatedTraceId: trace.traceId,
            relatedSpanId: chatSpan.traceScopeSpanId,
            role: 'user',
            content: 'What is in this source?',
          },
        ]}
        selectedNodeKey={null}
        setSelectedNodeKey={setSelectedNodeKey}
      />
    );

    expect(screen.getByText('test-model')).toBeInTheDocument();
    expect(screen.getByText('1 spans')).toBeInTheDocument();
    fireEvent.click(screen.getByText('What is in this source?'));

    expect(setSelectedNodeKey).toHaveBeenCalledWith('chat-span-user');
    expect(setSelectedSpan).toHaveBeenCalledWith('chat-span');
    expect(setSelectedTrace).toHaveBeenCalledWith('trace-1');
    expect(requestChatScroll).toHaveBeenCalledWith('chat-span', 'user');
  });

  it('collapses child spans without selecting the parent row', () => {
    const root = createSpan('root', 'request');
    const child = createSpan('child', 'database call', { parentId: 'root' });
    const setSelectedSpan = vi.fn();

    render(
      <TraceTreeNav
        trace={createTrace([root, child])}
        selectedSpanId={null}
        setSelectedTrace={vi.fn()}
        setSelectedSpan={setSelectedSpan}
        requestChatScroll={vi.fn()}
        messageAnchors={[]}
        selectedNodeKey={null}
        setSelectedNodeKey={vi.fn()}
      />
    );

    expect(screen.getByText('database call')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse request' }));

    expect(screen.queryByText('database call')).not.toBeInTheDocument();
    expect(setSelectedSpan).toHaveBeenCalledWith('root');
  });
});
