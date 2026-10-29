import { Badge, Box, Callout, Card, Code, Flex, Text } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import { isOk, isTrue, type JudgeResult } from '../hooks/judgeUtils';

export default function ResultCard({ result }: { readonly result: JudgeResult }) {
  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="start" justify="between" gap="3" wrap="wrap">
          <Box>
            <Text as="p" size="1" color="gray">
              Trace
            </Text>
            <Code size="2">{result.traceId}</Code>
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
    </Card>
  );
}
