import { Box, Flex, Text } from '@radix-ui/themes';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import styles from './AxialCodeCard/AxialCodeCard.module.css';

function splitTrace(trace: string): { user: string; assistant: string } {
  const match = /^User:\s*([\s\S]*?)\nAssistant:\s*([\s\S]*)$/.exec(trace);
  return match ? { user: match[1], assistant: match[2] } : { user: '', assistant: trace };
}

function MarkdownBubble({ role, text }: { readonly role: string; readonly text: string }) {
  return (
    <Box p="2" style={{ background: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }}>
      <Text size="1" weight="bold" as="div" mb="1">
        {role}
      </Text>
      <Box className={styles.exampleMarkdown}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({ children }) => (
              <Text as="p" size="2" mb="2">
                {children}
              </Text>
            ),
            strong: ({ children }) => <Text weight="bold">{children}</Text>,
            ul: ({ children }) => (
              <Box asChild>
                <ul>{children}</ul>
              </Box>
            ),
            ol: ({ children }) => (
              <Box asChild>
                <ol>{children}</ol>
              </Box>
            ),
            li: ({ children }) => (
              <li>
                <Text size="2">{children}</Text>
              </li>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </Box>
    </Box>
  );
}

export default function AxialCodeExampleConversation({ trace }: { readonly trace: string }) {
  const { user, assistant } = splitTrace(trace);
  return (
    <Flex direction="column" gap="2">
      {user && <MarkdownBubble role="User" text={user} />}
      <MarkdownBubble role="Assistant" text={assistant} />
    </Flex>
  );
}
