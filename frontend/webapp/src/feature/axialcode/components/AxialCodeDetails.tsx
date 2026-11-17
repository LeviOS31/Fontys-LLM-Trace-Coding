import { useMemo, useState } from 'react';
import {
  Badge,
  Blockquote,
  Box,
  Button,
  Flex,
  SegmentedControl,
  Tabs,
  Text,
} from '@radix-ui/themes';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type {
  AxialCodeSnapshotCode,
  AxialCodeSnapshotExample,
  AxialCodeSnapshotJustification,
} from '../../../shared/types/axialCodeSnapshotCode.ts';
import styles from '../components/AxialCodeCard/AxialCodeCard.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const VISIBLE_OPEN_CODES = 4;

// ---------- Open codes ----------

interface OpenCodeGroup {
  readonly quote: string;
  readonly reasons: readonly string[];
}

/** The model often cites the same quote for several open codes; show it once with a count. */
function groupJustifications(
  justifications: readonly AxialCodeSnapshotJustification[]
): OpenCodeGroup[] {
  const groups = new Map<string, string[]>();
  for (const j of justifications) {
    const key = j.quote.trim();
    groups.set(key, [...(groups.get(key) ?? []), j.justification]);
  }
  return [...groups].map(([quote, reasons]) => ({ quote, reasons }));
}

function OpenCodeRow({ group }: { readonly group: OpenCodeGroup }) {
  const [showWhy, setShowWhy] = useState(false);
  const Chevron = showWhy ? ChevronUp : ChevronDown;
  return (
    <Flex direction="column" gap="1" data-testid="axial-code-justification">
      <Flex gap="2" align="start">
        <Blockquote size="2" style={{ flex: 1 }}>
          “{group.quote}”
        </Blockquote>
        {group.reasons.length > 1 && (
          <Badge size="1" variant="soft">
            <X size={10} aria-hidden />
            <Text size="1" weight="bold">
              {group.reasons.length}
            </Text>
          </Badge>
        )}
      </Flex>
      <Box>
        <Button
          size="1"
          variant="ghost"
          aria-expanded={showWhy}
          onClick={() => setShowWhy((v) => !v)}
          style={{ fontWeight: 700 }}
        >
          {showWhy ? 'Hide reasoning' : 'Why does this belong?'}
          <Chevron size={14} aria-hidden />
        </Button>
      </Box>
      {showWhy && (
        <Flex direction="column" gap="1" pl="3">
          {group.reasons.map((reason, i) => (
            <Text key={i} as="p" size="1">
              {reason}
            </Text>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

function OpenCodeList({ code }: { readonly code: AxialCodeSnapshotCode }) {
  const [showAll, setShowAll] = useState(false);
  const groups = useMemo(
    () => groupJustifications(code.justifications ?? []),
    [code.justifications]
  );

  // Older results have no justifications; fall back to the plain open code badges.
  if (groups.length === 0) {
    return (
      <Flex wrap="wrap" gap="1">
        {code.sampleOpenCodes.map((c, index) => (
          <Badge key={`${c}-${index}`} variant="surface" size="1">
            {c}
          </Badge>
        ))}
      </Flex>
    );
  }

  const visible = showAll ? groups : groups.slice(0, VISIBLE_OPEN_CODES);
  const hidden = groups.length - visible.length;

  return (
    <Flex direction="column" gap="3">
      {visible.map((group) => (
        <OpenCodeRow key={group.quote} group={group} />
      ))}
      {(hidden > 0 || showAll) && groups.length > VISIBLE_OPEN_CODES && (
        <Box>
          <Button
            size="1"
            variant="soft"
            onClick={() => setShowAll((v) => !v)}
            style={{ fontWeight: 700 }}
          >
            {showAll ? 'Show fewer' : `Show ${hidden} more`}
            {showAll ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
          </Button>
        </Box>
      )}
    </Flex>
  );
}

// ---------- Examples ----------

/** The backend stores examples as "User: ...\nAssistant: ...". */
function splitTrace(trace: string): { user: string; assistant: string } {
  const match = /^User:\s*([\s\S]*?)\nAssistant:\s*([\s\S]*)$/.exec(trace);
  return match ? { user: match[1], assistant: match[2] } : { user: '', assistant: trace };
}

function Bubble({ role, text }: { readonly role: string; readonly text: string }) {
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

function ExampleView({
  example,
  kind,
}: {
  readonly example: AxialCodeSnapshotExample;
  readonly kind: 'positive' | 'negative';
}) {
  const { user, assistant } = splitTrace(example.trace);
  const accent = kind === 'positive' ? 'var(--green-9)' : 'var(--red-9)';
  return (
    <Flex
      direction="column"
      gap="2"
      pl="3"
      style={{ borderLeft: `3px solid ${accent}` }}
      data-testid={`axial-code-${kind}-example`}
    >
      {user && <Bubble role="User" text={user} />}
      <Bubble role="Assistant" text={assistant} />
      {example.reasoning && (
        <Text as="p" size="2">
          {example.reasoning}
        </Text>
      )}
    </Flex>
  );
}

function ExamplesPanel({ code }: { readonly code: AxialCodeSnapshotCode }) {
  const { positiveExample, negativeExample } = code;
  const [kind, setKind] = useState<'positive' | 'negative'>(
    positiveExample ? 'positive' : 'negative'
  );
  const active = kind === 'positive' ? positiveExample : negativeExample;

  return (
    <Flex direction="column" gap="3">
      {positiveExample && negativeExample && (
        <SegmentedControl.Root
          size="1"
          value={kind}
          onValueChange={(v) => setKind(v as 'positive' | 'negative')}
        >
          <SegmentedControl.Item value="positive">
            <Text weight="bold">Fits this code</Text>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="negative">
            <Text weight="bold">Does not fit</Text>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      )}
      {active && <ExampleView example={active} kind={kind} />}
    </Flex>
  );
}

// ---------- Expanded section ----------

export default function AxialCodeDetails({ code }: { readonly code: AxialCodeSnapshotCode }) {
  const hasExamples = Boolean(code.positiveExample || code.negativeExample);
  const openCodeTotal = code.justifications?.length ?? code.openCodeCount;

  const overview = (
    <Flex direction="column" gap="3">
      {code.rationale && (
        <Box
          p="3"
          data-testid="axial-code-rationale"
          style={{ background: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }}
        >
          <Text size="1" weight="bold" className={styles.sectionLabel} as="div" mb="1">
            Why this code exists
          </Text>
          <Text as="p" size="2">
            {code.rationale}
          </Text>
        </Box>
      )}
      <Box>
        <Text size="1" weight="bold" className={styles.sectionLabel} as="div" mb="2">
          Open codes ({openCodeTotal})
        </Text>
        <OpenCodeList code={code} />
      </Box>
    </Flex>
  );

  return (
    <Box pt="3" style={{ borderTop: '1px dashed var(--gray-5)' }}>
      {hasExamples ? (
        <Tabs.Root defaultValue="overview">
          <Tabs.List size="1">
            <Tabs.Trigger value="overview" style={{ fontWeight: 700 }}>
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger value="examples" style={{ fontWeight: 700 }}>
              Examples
            </Tabs.Trigger>
          </Tabs.List>
          <Box pt="3">
            <Tabs.Content value="overview">{overview}</Tabs.Content>
            <Tabs.Content value="examples">
              <ExamplesPanel code={code} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      ) : (
        overview
      )}
    </Box>
  );
}
