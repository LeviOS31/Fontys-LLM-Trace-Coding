import { Badge, Box, Flex, Heading, Text, ScrollArea } from '@radix-ui/themes';
import type { LlmMessage } from '../TraceGroupPage';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  llmMessages: LlmMessage[];
  selectedTraceId: string | null;
  setSelectedTrace: (traceId: string) => void;
  onScrollChange: (traceId: string | null) => void;
};

export function LlmContent({
  llmMessages,
  selectedTraceId,
  setSelectedTrace,
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

    const element = document.querySelector(
      `[data-trace-id="${selectedTraceId}"]`
    ) as HTMLElement | null;
    if (!element) return;

    const viewport = element.closest('[data-radix-scroll-area-viewport]');
    if (viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const isFullyVisible =
        elementRect.top >= viewportRect.top && elementRect.bottom <= viewportRect.bottom;
      if (isFullyVisible) return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedTraceId]);

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    const scrollBottom = scrollTop + event.currentTarget.clientHeight;

    let currentTraceId: string | null = null;

    for (const msg of llmMessages) {
      const element = document.querySelector(
        `[data-trace-id="${msg.relatedTraceId}"]`
      ) as HTMLElement;
      if (element) {
        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.offsetHeight;

        if (elementTop < scrollBottom && elementBottom > scrollTop) {
          currentTraceId = msg.relatedTraceId;
          break;
        }
      }
    }

    if (currentTraceId) {
      onScrollChange(currentTraceId);
    } else {
      onScrollChange(null);
    }
  };

  return (
    <ScrollArea type="hover" scrollbars="vertical" style={{ height: '90vh' }} onScroll={onScroll}>
      <Flex direction="column" py="3">
        <Box px="4">
          <Heading>LLM chat interaction</Heading>
        </Box>

        {llmMessages.map((msg, index) => (
          <>
            {(index === 1 || msg.relatedTraceId !== llmMessages[index - 1]?.relatedTraceId) &&
              index !== 0 && <hr style={{ width: '90%', color: 'var(--gray-5)' }} />}
            <Box
              key={msg.index}
              onClick={() => setSelectedTrace(msg.relatedTraceId)}
              style={{
                cursor: index === 0 ? 'auto' : 'pointer',
                backgroundColor:
                  (relatedTraceHover === msg.relatedTraceId ||
                    selectedTraceId === msg.relatedTraceId) &&
                  index !== 0
                    ? 'var(--accent-a3)'
                    : 'transparent',
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
            >
              {/* Title and divider */}
              {(index === 1 || msg.relatedTraceId !== llmMessages[index - 1]?.relatedTraceId) &&
                index !== 0 && (
                  <Flex direction="row" gap="2" align="center" pt="4">
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

              {/* Message content */}
              <Flex direction="column" gap="1" align={msg.role === 'user' ? 'end' : 'start'} pb="4">
                <Text size="3" color="gray" weight="bold">
                  {msg.role.toUpperCase()}
                </Text>
                <Text size="2">{msg.content}</Text>
              </Flex>
            </Box>
          </>
        ))}
      </Flex>
    </ScrollArea>
  );
}
