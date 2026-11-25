import { Badge, Box, Callout, Card, Flex, Text } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import { isOk, isTrue, type JudgeResult } from '../hooks/judgeUtils';

export default function ResultCard({
  result,
  onOpen,
}: {
  readonly result: JudgeResult;
  readonly onOpen: () => void;
}) {
  return (
    <Card asChild>
      <button
        type="button"
        aria-label={`View LLM content for trace ${result.traceId}`}
        onClick={onOpen}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
      >
        <Flex direction="column" gap="3">
          <Flex align="start" justify="between" gap="3" wrap="wrap">
            <Box>
              <Text as="p" size="1" color="gray">
                {result.judgingTrace ? 'Trace' : 'Raw LLM output'}
              </Text>
              <p
                style={{
                  backgroundColor: result.judgingTrace ? 'var(--green-3)' : 'var(--blue-3)',
                  color: result.judgingTrace ? 'var(--green-11)' : 'var(--blue-11)',
                  fontSize: '0.75em',
                  padding: '0',
                  margin: '0',
                }}
              >{result.traceId}</p>
            </Box>
            <Flex gap="2">
              <Badge color={isTrue(result) ? 'green' : 'red'} variant="soft" size="2">
                Verdict: {result.verdict ?? '–'}
              </Badge>
              <Badge color={isOk(result) ? 'green' : 'red'} variant="soft" size="2">
                {result.status}
              </Badge>
            </Flex>
          </Flex>

          {result.reasoning && (
            <Text as="p" size="2" style={{ maxWidth: 720, whiteSpace: 'pre-wrap' }}>
              {result.reasoning}
            </Text>
          )}

          {result.error && (
            <Callout.Root color="red" size="1">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{result.error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>
      </button>
    </Card>
  );
}
