import { useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Card, Flex, Heading, IconButton, Text } from '@radix-ui/themes';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import type {
  AxialCodeChange,
  AxialCodeComparison,
} from '../../../../shared/util/compareAxialCodes.ts';
import ChangeKindBadge from '../ChangeKindBadge.tsx';
import { buildChangeRows, sourcesOf, targetsOf, type ChangeRow } from './buildChangeRows.ts';
import { describeChangeRow, type OpenCodeRef } from './describeChangeRow.ts';
import styles from './ChangesSection.module.css';

// Moved open codes shown before the list is expanded.
const MOVED_PREVIEW = 5;

// Width of the badge column, which the details of a row are aligned with.
const BADGE_COLUMN = 96;
const COLUMN_GAP = 12;

interface ChangesSectionProps {
  readonly comparison: AxialCodeComparison;
  readonly previousCodes: readonly AxialCode[];
  readonly nextCodes: readonly AxialCode[];
  readonly colorOf: ReadonlyMap<AxialCode, string>;
  readonly openCodeTextById: Readonly<Record<string, string>>;
}

const openCodes = (count: number) => `${count} open code${count === 1 ? '' : 's'}`;

/**
 * Scrolls to the card of a code in the side-by-side list below and briefly
 * outlines it, so it is clear which card the click led to.
 */
function scrollToCard(label: string, snap: 'A' | 'B') {
  const card = document.querySelector<HTMLElement>(
    `[data-testid="axial-code-card"][data-snap="${snap}"][data-axial-code-name="${CSS.escape(label)}"]`
  );
  if (!card) return;

  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.animate?.(
    [
      { boxShadow: '0 0 0 3px var(--accent-8)' },
      { boxShadow: '0 0 0 3px var(--accent-8)', offset: 0.7 },
      { boxShadow: '0 0 0 0 transparent' },
    ],
    { duration: 1800, easing: 'ease-out' }
  );
}

function CodeLink({
  code,
  snap,
  color,
  size = '2',
}: {
  readonly code: AxialCode;
  readonly snap: 'A' | 'B';
  readonly color: string | undefined;
  readonly size?: '1' | '2';
}) {
  return (
    <button
      type="button"
      className={styles.codeLink}
      onClick={() => scrollToCard(code.label, snap)}
    >
      <Box style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: color }} />
      <Text
        size={size}
        weight="medium"
        className={styles.label}
        style={{ overflowWrap: 'anywhere' }}
      >
        {code.label}
      </Text>
    </button>
  );
}

function OpenCodeDelta({ change }: { readonly change: AxialCodeChange }) {
  const added = change.addedTraceIds.length;
  const removed = change.removedTraceIds.length;

  if (change.kind === 'new' || (added === 0 && removed === 0)) {
    return (
      <Text size="1" color="gray">
        {openCodes(change.code.traceIds.length)}
      </Text>
    );
  }

  return (
    <Flex gap="2">
      {added > 0 && (
        <Text size="1" weight="bold" color="green">
          +{added}
        </Text>
      )}
      {removed > 0 && (
        <Text size="1" weight="bold" color="red">
          −{removed}
        </Text>
      )}
    </Flex>
  );
}

type OpenCodeTone = 'kept' | 'added' | 'left';

const TONE = {
  kept: { sign: '•', color: 'gray' },
  added: { sign: '+', color: 'green' },
  left: { sign: '−', color: 'red' },
} as const;

function OpenCodeList({
  title,
  tone,
  refs,
  openCodeTextById,
  note,
}: {
  readonly title: string;
  readonly tone: OpenCodeTone;
  readonly refs: readonly OpenCodeRef[];
  readonly openCodeTextById: Readonly<Record<string, string>>;
  readonly note: (ref: OpenCodeRef) => ReactNode;
}) {
  if (refs.length === 0) return null;
  const { sign, color } = TONE[tone];

  return (
    <Flex direction="column" gap="1" data-testid={`axial-code-change-${tone}`}>
      <Text size="1" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title} ({refs.length})
      </Text>
      {refs.map((ref) => (
        <Flex key={ref.traceId} align="baseline" gap="2" wrap="wrap">
          <Text size="2" weight="bold" color={color} style={{ width: 10, flexShrink: 0 }}>
            {sign}
          </Text>
          <Text size="2" style={{ overflowWrap: 'anywhere' }}>
            “{openCodeTextById[ref.traceId] ?? ref.traceId}”
          </Text>
          {note(ref)}
        </Flex>
      ))}
    </Flex>
  );
}

function RelatedCode({
  prefix,
  code,
  snap,
  colorOf,
  fallback,
}: {
  readonly prefix: string;
  readonly code: AxialCode | undefined;
  readonly snap: 'A' | 'B';
  readonly colorOf: ReadonlyMap<AxialCode, string>;
  readonly fallback?: string;
}) {
  if (!code) {
    return fallback ? (
      <Text size="1" color="gray">
        {fallback}
      </Text>
    ) : null;
  }

  return (
    <Flex align="center" gap="1">
      <Text size="1" color="gray">
        {prefix}
      </Text>
      <CodeLink code={code} snap={snap} color={colorOf.get(code)} size="1" />
    </Flex>
  );
}

function ChangeRowView({
  row,
  previousCodes,
  nextCodes,
  colorOf,
  openCodeTextById,
}: {
  readonly row: ChangeRow;
  readonly previousCodes: readonly AxialCode[];
  readonly nextCodes: readonly AxialCode[];
  readonly colorOf: ReadonlyMap<AxialCode, string>;
  readonly openCodeTextById: Readonly<Record<string, string>>;
}) {
  const [isOpen, setIsOpen] = useState(row.kind !== 'unchanged');
  const from = sourcesOf(row);
  const to = targetsOf(row);
  const details = useMemo(
    () => describeChangeRow(row, previousCodes, nextCodes),
    [row, previousCodes, nextCodes]
  );
  const showTargetHeaders = details.groups.length > 1;

  return (
    <Box
      data-testid="axial-code-change-row"
      py="3"
      style={{ borderTop: '1px solid var(--gray-a4)' }}
    >
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `${BADGE_COLUMN}px minmax(0, 1fr) 20px minmax(0, 1fr) 24px`,
          alignItems: 'start',
          columnGap: COLUMN_GAP,
        }}
      >
        <Box pt="1">
          <ChangeKindBadge kind={row.kind} />
        </Box>

        <Flex direction="column" gap="1" pt="1">
          {from.length === 0 ? (
            <Text size="2" color="gray">
              —
            </Text>
          ) : (
            from.map((code) => (
              <CodeLink key={code.label} code={code} snap="A" color={colorOf.get(code)} />
            ))
          )}
        </Flex>

        <Box pt="1" style={{ color: 'var(--gray-9)' }}>
          {to.length > 0 && <ArrowRight size={16} />}
        </Box>

        <Flex direction="column" gap="1" pt="1">
          {to.length === 0 ? (
            <Text size="1" color="gray">
              {openCodes(row.kind === 'removed' ? row.from.traceIds.length : 0)} moved to other
              codes
            </Text>
          ) : (
            to.map((change) => (
              <Flex key={change.code.label} align="center" justify="between" gap="3" wrap="wrap">
                <CodeLink code={change.code} snap="B" color={colorOf.get(change.code)} />
                <OpenCodeDelta change={change} />
              </Flex>
            ))
          )}
        </Flex>

        <IconButton
          variant="ghost"
          size="1"
          color="gray"
          aria-expanded={isOpen}
          aria-label={
            isOpen ? 'Hide the details of this change' : 'Show the details of this change'
          }
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>
      </Box>

      {isOpen && (
        <Flex
          direction="column"
          gap="3"
          mt="3"
          p="3"
          data-testid="axial-code-change-details"
          style={{
            marginLeft: BADGE_COLUMN + COLUMN_GAP,
            background: 'var(--gray-a2)',
            borderRadius: 'var(--radius-3)',
          }}
        >
          <Text size="2" weight="medium" data-testid="axial-code-change-summary-text">
            {details.summary}
          </Text>

          {details.description && (
            <Flex direction="column" gap="1">
              <Text
                size="1"
                color="gray"
                style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Description
              </Text>
              <Text size="2" color="gray" style={{ textDecoration: 'line-through' }}>
                {details.description.before}
              </Text>
              <Text size="2">{details.description.after}</Text>
            </Flex>
          )}

          {details.groups.map((group) => (
            <Flex key={group.target.label} direction="column" gap="2">
              {showTargetHeaders && (
                <Flex align="center" gap="2">
                  <ArrowRight size={14} color="var(--gray-9)" />
                  <CodeLink code={group.target} snap="B" color={colorOf.get(group.target)} />
                </Flex>
              )}
              <Flex direction="column" gap="2" style={{ paddingLeft: showTargetHeaders ? 22 : 0 }}>
                <OpenCodeList
                  title={row.kind === 'new' ? 'Open codes' : 'Kept'}
                  tone="kept"
                  refs={group.kept}
                  openCodeTextById={openCodeTextById}
                  note={(ref) => (
                    <RelatedCode prefix="from" code={ref.other} snap="A" colorOf={colorOf} />
                  )}
                />
                <OpenCodeList
                  title="Joined"
                  tone="added"
                  refs={group.added}
                  openCodeTextById={openCodeTextById}
                  note={(ref) => (
                    <RelatedCode
                      prefix="from"
                      code={ref.other}
                      snap="A"
                      colorOf={colorOf}
                      fallback="newly coded"
                    />
                  )}
                />
              </Flex>
            </Flex>
          ))}

          <OpenCodeList
            title={row.kind === 'removed' ? 'Its open codes went to' : 'Left'}
            tone="left"
            refs={details.left}
            openCodeTextById={openCodeTextById}
            note={(ref) => (
              <RelatedCode
                prefix="to"
                code={ref.other}
                snap="B"
                colorOf={colorOf}
                fallback="no longer in any code"
              />
            )}
          />
        </Flex>
      )}
    </Box>
  );
}

/**
 * Lists every difference between the approved axial codes (version A) and the
 * regenerated ones (version B) in one place: what kind of change it is, a short
 * explanation, and which open codes were kept, joined or left, including the
 * removed codes, which have no card of their own.
 */
export default function ChangesSection({
  comparison,
  previousCodes,
  nextCodes,
  colorOf,
  openCodeTextById,
}: ChangesSectionProps) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [showAllMoved, setShowAllMoved] = useState(false);

  const rows = useMemo(() => buildChangeRows(comparison), [comparison]);
  const changedRows = rows.filter((row) => row.kind !== 'unchanged');
  const unchangedCount = rows.length - changedRows.length;
  const visibleRows = showUnchanged ? rows : changedRows;

  const moved = comparison.moved;
  const visibleMoved = showAllMoved ? moved : moved.slice(0, MOVED_PREVIEW);

  return (
    <Box data-testid="axial-code-changes">
      <Flex align="end" justify="between" gap="3" mb="3">
        <Box>
          <Heading size="3" style={{ letterSpacing: '-0.01em' }}>
            Changes
          </Heading>
          <Text as="p" size="2" color="gray" mt="1">
            How the codes of version A became the codes of version B, and which open codes moved
            between them. Click a code to find it in the list below.
          </Text>
        </Box>
        {unchangedCount > 0 && (
          <Button variant="ghost" size="1" onClick={() => setShowUnchanged((value) => !value)}>
            {showUnchanged ? 'Hide unchanged' : `Show unchanged (${unchangedCount})`}
          </Button>
        )}
      </Flex>

      <Card size="2">
        {visibleRows.length === 0 ? (
          <Text size="2" color="gray">
            The axial codes did not change.
          </Text>
        ) : (
          <Box style={{ marginTop: -13 }}>
            {visibleRows.map((row, index) => (
              <ChangeRowView
                key={`${row.kind}-${index}`}
                row={row}
                previousCodes={previousCodes}
                nextCodes={nextCodes}
                colorOf={colorOf}
                openCodeTextById={openCodeTextById}
              />
            ))}
          </Box>
        )}

        {moved.length > 0 && (
          <Box mt="4" pt="3" style={{ borderTop: '1px dashed var(--gray-a6)' }}>
            <Text
              as="div"
              size="1"
              color="gray"
              mb="2"
              style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              All moved open codes ({moved.length})
            </Text>
            <Flex direction="column" gap="2">
              {visibleMoved.map((item) => (
                <Box
                  key={item.traceId}
                  data-testid="axial-code-moved"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) 20px minmax(0, 1fr)',
                    alignItems: 'start',
                    columnGap: COLUMN_GAP,
                  }}
                >
                  <Text size="2" style={{ fontStyle: 'italic', overflowWrap: 'anywhere' }}>
                    “{openCodeTextById[item.traceId] ?? item.traceId}”
                  </Text>
                  <CodeLink code={item.from} snap="A" color={colorOf.get(item.from)} />
                  <Box style={{ color: 'var(--gray-9)' }}>
                    <ArrowRight size={16} />
                  </Box>
                  <CodeLink code={item.to} snap="B" color={colorOf.get(item.to)} />
                </Box>
              ))}
            </Flex>
            {moved.length > MOVED_PREVIEW && (
              <Button
                variant="ghost"
                size="1"
                mt="2"
                onClick={() => setShowAllMoved((value) => !value)}
              >
                {showAllMoved ? 'Show less' : `Show all ${moved.length}`}
              </Button>
            )}
          </Box>
        )}
      </Card>
    </Box>
  );
}
