import { Badge, Box, Button, Dialog, Flex, Heading, Text, ScrollArea } from '@radix-ui/themes';
import type { LlmMessage } from '../TraceGroupPage';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import prettier from 'prettier/standalone';
import babelPlugin from 'prettier/plugins/babel';
import estreePlugin from 'prettier/plugins/estree';
import htmlPlugin from 'prettier/plugins/html';
import postcssPlugin from 'prettier/plugins/postcss';

type Props = {
  llmMessages: LlmMessage[];
  selectedTraceId: string | null;
  selectedSpanId: string | null;
  selectedMessageRole: 'user' | 'assistant' | 'system' | null;
  selectedSourceFile: string | null;
  setSelectedTrace: (traceId: string) => void;
  scrollRequest: number;
  onScrollChange: (
    traceId: string | null,
    spanId: string | null,
    role: 'user' | 'assistant' | null
  ) => void;
};

async function FormatCode(language: string, codeString: string): Promise<string> {
  const lang = (language || '').toLowerCase();

  // 1. Handle JSON natively
  if (lang === 'json') {
    try {
      return JSON.stringify(JSON.parse(codeString), null, 2);
    } catch {
      return codeString;
    }
  }

  // 2. Prettier Parser Mapping
  let parser: string | null = null;
  let plugins: any[] = [];

  if (['js', 'jsx', 'javascript', 'ts', 'typescript'].includes(lang)) {
    parser = 'babel';
    plugins = [babelPlugin, estreePlugin];
  } else if (['html', 'xml', 'svg'].includes(lang)) {
    parser = 'html';
    plugins = [htmlPlugin];
  } else if (['css', 'scss', 'less'].includes(lang)) {
    parser = 'css';
    plugins = [postcssPlugin];
  }

  if (parser) {
    try {
      return await prettier.format(codeString, {
        parser,
        plugins,
        tabWidth: 2,
        useTabs: false,
      });
    } catch (e) {
      console.warn(`Prettier formatting failed for language "${lang}":`, e);
      return codeString;
    }
  }

  return codeString;
}

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
  selectedSourceFile,
  scrollRequest,
  onScrollChange,
}: Readonly<Props>) {
  const [relatedTraceHover] = useState<string | null>(null);
  const messageElements = useRef(new Map<string, HTMLElement>());
  const scrollFrame = useRef<number | null>(null);
  const lastScrolledMessage = useRef<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<{
    sourceFile: string;
    chunks: NonNullable<LlmMessage['retrievedSources']>[number]['chunks'];
  } | null>(null);

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
    const sourceSelector =
      spanSelector && selectedSourceFile
        ? `${spanSelector}[data-message-role="user"] details[data-source-file="${CSS.escape(selectedSourceFile)}"]`
        : null;
    const element = sourceSelector
      ? (document.querySelector(sourceSelector) as HTMLElement | null)
      : spanSelector
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
        top: viewport.scrollTop + elementRect.top - viewportRect.top - viewportRect.height / 3,
        behavior: 'smooth',
      });
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedTraceId, selectedSpanId, selectedMessageRole, selectedSourceFile, scrollRequest]);

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const source = event.currentTarget;
    const viewport = source.matches('[data-radix-scroll-area-viewport]')
      ? source
      : source.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport || scrollFrame.current !== null) return;

    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      const viewportRect = viewport.getBoundingClientRect();
      const viewportCenter = viewportRect.top + viewportRect.height / 2;

      let closest: { traceId: string; spanId: string; role: 'user' | 'assistant' } | null = null;
      let closestDistance = Infinity;

      for (const msg of llmMessages) {
        if (msg.role !== 'user' && msg.role !== 'assistant') continue;

        const element = messageElements.current.get(
          `${msg.relatedTraceId}:${msg.relatedSpanId}:${msg.role}`
        );
        if (!element) continue;

        const elementRect = element.getBoundingClientRect();
        const distance = Math.abs(elementRect.top + elementRect.height / 2 - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closest = { traceId: msg.relatedTraceId, spanId: msg.relatedSpanId, role: msg.role };
        }
      }

      const closestKey = closest
        ? `${closest.traceId}:${closest.spanId}:${closest.role}`
        : null;
      if (closestKey === lastScrolledMessage.current) return;
      lastScrolledMessage.current = closestKey;
      if (closest) onScrollChange(closest.traceId, closest.spanId, closest.role);
      else onScrollChange(null, null, null);
    });
  };

  useEffect(
    () => () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    },
    []
  );

  useEffect(() => {
    lastScrolledMessage.current = null;
  }, [llmMessages]);

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
          <Fragment key={`${msg.relatedTraceId}-${msg.index}-${msg.role}`}>
            {index === 0 && <hr style={{ width: '90%', color: 'var(--gray-5)' }} />}
            {/* Title and divider */}
            {index === 0 && (
              <Flex
                direction="row"
                gap="2"
                align="center"
                px="4"
                py="2"
                style={{ borderRadius: 'var(--radius-2)' }}
              >
                <Badge color="green" radius="full" size="3">
                  <Text as="span" weight="bold">
                    {uniqueTraces.indexOf(msg.relatedTraceId) + 1}
                  </Text>
                </Badge>
                <Heading as="h4" size="3" weight="bold" style={{ transform: 'translateY(-2px)' }}>
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
              px="4"
              py="1"
              ref={(element: HTMLDivElement | null) => {
                const key = `${msg.relatedTraceId}:${msg.relatedSpanId}:${msg.role}`;
                if (element) messageElements.current.set(key, element);
                else messageElements.current.delete(key);
              }}
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
                    padding: '1em 1.5em',
                    paddingBottom: '0.5em',
                    borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '20px',
                    borderTopRightRadius: msg.role === 'user' ? '2px' : '20px',
                    borderBottomLeftRadius: '20px',
                    borderBottomRightRadius: '20px',
                    minWidth: 0,
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-2)',
                    lineHeight: 'var(--line-height-2)',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    textAlign:
                      msg.role === 'user' ? 'end' : msg.role === 'assistant' ? 'start' : 'center',
                    backgroundColor:
                      relatedTraceHover === msg.relatedTraceId ||
                      selectedTraceId === msg.relatedTraceId
                        ? msg.role === 'system'
                          ? 'var(--blue-a5)'
                          : msg.role === 'user'
                            ? '#A7F3D0'
                            : '#CBD5E1'
                        : 'transparent',
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
                            textAlign: 'start',
                          }}
                        >
                          {children}
                        </p>
                      ),
                      li: ({ children }) => <li style={{ fontFamily: 'inherit', textAlign: 'start' }}>{children}</li>,
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
                      async code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        let codeblock = String(children).replace(/\n$/, '');

                        if (match) {
                          try {
                            codeblock = await FormatCode(match[1], codeblock);
                          } catch (error) {
                            console.error('Error parsing', error);
                          }
                        }

                        return match ? (
                          <div
                            style={{
                              backgroundColor: 'rgb(40, 44, 52)',
                              borderRadius: 'var(--radius-6)',
                            }}
                          >
                            <p
                              style={{
                                minWidth: 0,
                                fontFamily: 'inherit',
                                textAlign: 'left',
                                color: 'lightgray',
                                fontWeight: 'bold',
                                fontSize: '1.25em',
                                paddingLeft: '0.825em',
                                paddingTop: '0.5em',
                                marginBottom: '0.5em',
                              }}
                            >
                              {match[1]}
                            </p>
                            <SyntaxHighlighter
                              language={match[1]}
                              style={oneDark}
                              PreTag="div"
                              customStyle={{
                                maxWidth: '100%',
                                overflowX: 'auto',
                                textAlign: 'left',
                                paddingTop: '0px',
                              }}
                            >
                              {codeblock}
                            </SyntaxHighlighter>
                          </div>
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
              {msg.role === 'user' && msg.retrievedSources && msg.retrievedSources.length > 0 && (
                <Flex direction="column" gap="2" align="end" pb="2">
                  <Text size="1" weight="bold" color="gray">
                    RETRIEVED SOURCES
                  </Text>
                  {msg.retrievedSources.map((source) => (
                    <Button
                      key={`${msg.relatedSpanId}-${source.sourceFile}`}
                      type="button"
                      variant="soft"
                      radius="full"
                      color="gray"
                      data-source-file={source.sourceFile}
                      onClick={() =>
                        setSelectedSource({
                          sourceFile: source.sourceFile,
                          chunks: source.chunks,
                        })
                      }
                    >
                      <Flex align="center" gap="2" wrap="wrap">
                        <FileText size={14} />
                        <Text size="2" weight="medium">
                          {source.sourceFile}
                        </Text>
                        <Badge size="1" color="gray">
                          {source.chunks.length} chunk{source.chunks.length === 1 ? '' : 's'}
                        </Badge>
                      </Flex>
                    </Button>
                  ))}
                </Flex>
              )}
            </Box>
          </Fragment>
        ))}
      </Flex>
      <Dialog.Root
        open={selectedSource !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSource(null);
        }}
      >
        <Dialog.Content maxWidth="760px" style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <Dialog.Title>{selectedSource?.sourceFile}</Dialog.Title>
          <Dialog.Description size="2" color="gray" mb="4">
            Retrieved source content
          </Dialog.Description>
          <Flex direction="column" gap="3">
            {selectedSource?.chunks.map((chunk, chunkIndex) => (
              <Box
                key={chunk.id ?? `${selectedSource.sourceFile}-${chunkIndex}`}
                p="3"
                style={{
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: 'var(--gray-4)',
                }}
              >
                <Flex align="center" gap="2" mb="2" wrap="wrap">
                  <Badge size="1" color={chunk.usedForGeneration ? 'green' : 'gray'}>
                    {chunk.usedForGeneration ? 'Used for generation' : 'Not used for generation'}
                  </Badge>
                  {chunk.score !== undefined && (
                    <Text size="1" color="gray">
                      Score: {chunk.score.toFixed(3)}
                    </Text>
                  )}
                  {chunk.id && (
                    <Text size="1" color="gray">
                      {chunk.id}
                    </Text>
                  )}
                </Flex>
                {chunk.content && (
                  <Text
                    as="p"
                    size="2"
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                  >
                    {chunk.content}
                  </Text>
                )}
              </Box>
            ))}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </ScrollArea>
  );
}
