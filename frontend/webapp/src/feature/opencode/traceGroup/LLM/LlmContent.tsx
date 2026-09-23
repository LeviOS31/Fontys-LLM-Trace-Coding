import { Badge, Box, Flex, Heading, Text, ScrollArea } from '@radix-ui/themes';
import type { LlmMessage } from '../TraceGroupPage';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

type Props = {
  llmMessages: LlmMessage[];
  selectedTraceId: string | null;
  selectedSpanId: string | null;
  selectedMessageRole: 'user' | 'assistant' | null;
  setSelectedTrace: (traceId: string) => void;
  scrollRequest: number;
  onScrollChange: (
    traceId: string | null,
    spanId: string | null,
    role: 'user' | 'assistant' | null
  ) => void;
};

// Strip leading whitespace per line so markdown never mistakes
// indented user text for a fenced code block.
function normalizeContent(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n');
}

export function LlmContent({
  llmMessages,
  selectedTraceId,
  selectedSpanId,
  selectedMessageRole,
  setSelectedTrace,
  scrollRequest,
  onScrollChange,
}: Readonly<Props>) {
  const [relatedTraceHover, setRelatedTraceHover] = useState<string | null>(null);

  const uniqueTraces = useMemo(
    () => Array.from(new Set(llmMessages.map((msg) => msg.relatedTraceId))),
    [llmMessages]
  );

  // Scroll the chat to the selected trace (e.g. when navigating with the
  // arrow keys), unless its first message is already fully visible.
  useEffect(() => {
    if (!selectedTraceId) return;

    const spanSelector = selectedSpanId
      ? `[data-trace-id="${selectedTraceId}"][data-span-id="${selectedSpanId}"]`
      : null;
    const element = spanSelector
      ? ((document.querySelector(
          `${spanSelector}[data-message-role="${selectedMessageRole ?? 'user'}"]`
        ) as HTMLElement | null) ?? (document.querySelector(spanSelector) as HTMLElement | null))
      : null;
    const traceElement = document.querySelector(
      `[data-trace-id="${selectedTraceId}"]`
    ) as HTMLElement | null;
    const target = element ?? traceElement;
    if (!target) return;

    const viewport = target.closest('[data-radix-scroll-area-viewport]');
    if (viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const elementRect = target.getBoundingClientRect();
      const isFullyVisible =
        elementRect.top >= viewportRect.top && elementRect.bottom <= viewportRect.bottom;
      if (isFullyVisible) return;

      viewport.scrollTo({
        top: viewport.scrollTop + elementRect.top - viewportRect.top,
        behavior: 'smooth',
      });
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedTraceId, selectedSpanId, selectedMessageRole, scrollRequest]);

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const source = event.currentTarget;
    const viewport = source.matches('[data-radix-scroll-area-viewport]')
      ? source
      : source.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.top + viewportRect.height / 2;

    let closest: { traceId: string; spanId: string; role: 'user' | 'assistant' } | null = null;
    let closestDistance = Infinity;

    for (const msg of llmMessages) {
      if (msg.role !== 'user' && msg.role !== 'assistant') continue; // skip system messages

      const element = document.querySelector(
        `[data-trace-id="${msg.relatedTraceId}"][data-span-id="${msg.relatedSpanId}"][data-message-role="${msg.role}"]`
      ) as HTMLElement | null;
      if (!element) continue;

      const elementRect = element.getBoundingClientRect();
      const distance = Math.abs(elementRect.top + elementRect.height / 2 - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = { traceId: msg.relatedTraceId, spanId: msg.relatedSpanId, role: msg.role };
      }
    }

    if (closest) {
      onScrollChange(closest.traceId, closest.spanId, closest.role);
    } else {
      onScrollChange(null, null, null);
    }
  };

  return (
    <ScrollArea
      type="hover"
      scrollbars="vertical"
      style={{ height: '100%', minHeight: 0 }}
      onScroll={onScroll}
    >
      <Flex direction="column" py="3">
        <Box px="4">
          <Heading>LLM chat interaction</Heading>
        </Box>

        {llmMessages.map((msg, index) => (
          <>
              {index === 0 &&
                 <hr style={{ width: '90%', color: 'var(--gray-5)' }} />}
              {/* Title and divider */}
              {index === 0  &&
                  (
                  <Flex direction="row" gap="2" align="center" px="4" py="2"  style={{ borderRadius: 'var(--radius-2)', backgroundColor: 'var(--accent-a3)' }}>
                    <Badge color="green" radius="full" size="3">
                      <Text as="span" weight="bold">
                        {uniqueTraces.indexOf(msg.relatedTraceId) + 1}
                      </Text>
                    </Badge>
                    <Heading
                      as="h4"
                      size="3"
                      weight="bold"
                      style={{ transform: 'translateY(-2px)' }}
                    >
                      {msg.modelName?.toUpperCase() ?? 'UNKOWN MODEL'}
                    </Heading>
                    {msg.amountOfSpans && (
                      <Badge color="gray" style={{ transform: 'translateY(-2px)' }}>
                        {msg.amountOfSpans} span{msg.amountOfSpans > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </Flex>
                )}
            <Box
              key={`${msg.relatedTraceId}-${msg.index}-${msg.role}`}
              onClick={() => setSelectedTrace(msg.relatedTraceId)}
              style={{
                cursor: index === 0 ? 'auto' : 'pointer',
                backgroundColor:
                  (relatedTraceHover === msg.relatedTraceId ||
                    selectedTraceId === msg.relatedTraceId)
                    ? msg.role === 'system' ? 'var(--blue-a4)' : 'var(--accent-a3)'
                    : 'transparent',
                borderBottom: index === llmMessages.length - 1 ? 'none' : '4px solid var(--gray-5)',
              }}
              onMouseEnter={() => {
                if (index !== 0) setRelatedTraceHover(msg.relatedTraceId);
              }}
              onMouseLeave={() => {
                setRelatedTraceHover(null);
              }}
              px="4"
              py="1"
              data-trace-id={msg.relatedTraceId}
              data-span-id={msg.relatedSpanId}
              data-message-role={msg.role}
            >

              {/* Message content */}
              <Flex
                direction="column"
                gap="1"
                align={msg.role === 'user' ? 'end' : msg.role === 'assistant' ? 'start' : 'center'}
                pb="2"
                style={{ maxWidth: '100%', width: '100%', minWidth: 0 }}
              >
                <Text size="3" color="gray" weight="bold">
                  {msg.role.toUpperCase()}
                </Text>
                <Box
                  style={{
                    maxWidth: '100%',
                    width: '100%',
                    minWidth: 0,
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-2)',
                    lineHeight: 'var(--line-height-2)',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    textAlign: msg.role === 'user' ? 'end' : msg.role === 'assistant' ? 'start' : 'center',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      p: ({ children }) => (
                        <p
                          style={{
                            margin: '0 0 0.5em',
                            minWidth: 0,
                            fontFamily: 'inherit',
                            textAlign: msg.role === 'user' ? 'end' : msg.role === 'assistant' ? 'start' : 'center',
                          }}
                        >
                          {children}
                        </p>
                      ),
                      li: ({ children }) => <li style={{ fontFamily: 'inherit' }}>{children}</li>,
                      pre: ({ children }) => (
                        <pre
                          style={{
                            maxWidth: '100%',
                            margin: '0.5em 0',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            textAlign: 'left', // code should stay left-aligned even in user messages
                          }}
                        >
                          {children}
                        </pre>
                      ),
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            language={match[1]}
                            style={oneDark}
                            PreTag="div"
                            customStyle={{ maxWidth: '100%', overflowX: 'auto', textAlign: 'left' }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code
                            className={className}
                            style={{
                              fontFamily: 'inherit',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {normalizeContent(msg.content)}
                  </ReactMarkdown>
                </Box>
              </Flex>
            </Box>
          </>
        ))}
      </Flex>
    </ScrollArea>
  );
}
