import { Badge, Flex, ScrollArea, Text } from '@radix-ui/themes';
import type { LlmMessage } from '../TraceGroupPage';

type Props = {
  llmMessages: LlmMessage[];
  scrollTraceId: string | null;
  selectedTraceId: string | null;
  setSelectedTrace: (traceId: string) => void;
};

export function LlmNav({
  llmMessages,
  scrollTraceId,
  selectedTraceId,
  setSelectedTrace,
}: Readonly<Props>) {
  return (
    <ScrollArea type="hover" scrollbars="vertical" style={{ height: '90vh' }}>
      <Flex direction="column" gap="2">
        <Text color="gray" size="2">
          {llmMessages
            .filter(
              (msg, idx) => idx === 0 || msg.relatedTraceId !== llmMessages[idx - 1]?.relatedTraceId
            )
            .map((msg, index) => (
              <Flex
                key={msg.relatedTraceId}
                gap="2"
                my="3"
                p="1"
                onClick={() => setSelectedTrace(msg.relatedTraceId)}
                style={{
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor:
                    selectedTraceId === msg.relatedTraceId ? 'var(--accent-a3)' : 'transparent',
                  borderLeft:
                    scrollTraceId === msg.relatedTraceId
                      ? '3px solid var(--accent-9)'
                      : '3px solid transparent',
                }}
                wrap="nowrap"
              >
                <Badge radius="full" color="green">
                  {index + 1}
                </Badge>
                <Text>{msg.modelName ?? 'UNKNOWN MODEL'}</Text>
                <Badge radius="medium">
                  {msg.amountOfSpans} span{msg.amountOfSpans !== 1 ? 's' : ''}
                </Badge>
              </Flex>
            ))}
        </Text>
      </Flex>
    </ScrollArea>
  );
}
