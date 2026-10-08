import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import type {
  AxialCodeChange,
  AxialCodeComparison,
} from '../../../../shared/util/compareAxialCodes.ts';
import ChangeKindBadge from '../ChangeKindBadge.tsx';
import { CHANGE_KIND_META } from '../changeKindMeta.ts';
import { buildChangeRows, sourcesOf, targetsOf, type ChangeRow } from './buildChangeRows.ts';
import { describeChangeRow, type OpenCodeRef } from './describeChangeRow.ts';
import styles from './ChangesSection.module.css';

// Moved open codes shown before the list is expanded.
const MOVED_PREVIEW = 5;

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
      onClick={(event: MouseEvent) => {
        // The code sits inside a row that opens on click; following the link should not toggle it.
        event.stopPropagation();
        scrollToCard(code.label, snap);
      }}
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

/** One column of open codes in the details of a row (kept, joined or left). */
function OpenCodeColumn({
  title,
  tone,
  refs,
  openCodeTextById,
  colorOf,
  relation,
}: {
  readonly title: string;
  readonly tone: OpenCodeTone;
  readonly refs: readonly OpenCodeRef[];
  readonly openCodeTextById: Readonly<Record<string, string>>;
  readonly colorOf: ReadonlyMap<AxialCode, string>;
  /** How the related code of an open code is introduced, and what to say without one. */
  readonly relation?: { readonly prefix: string; readonly snap: 'A' | 'B'; readonly none?: string };
}) {
  if (refs.length === 0) return null;

  return (
    <Box className={styles.column} data-testid={`axial-code-change-${tone}`}>
      <Text size="1" weight="bold" color="gray" style={{ letterSpacing: '0.02em' }}>
        {title} · {refs.length}
      </Text>
      {refs.map((ref) => (
        <Box key={ref.traceId} className={styles.openCode} data-tone={tone}>
          <Text size="2" style={{ overflowWrap: 'anywhere' }}>
            {openCodeTextById[ref.traceId] ?? ref.traceId}
          </Text>
          {relation && ref.other && (
            <Flex align="center" gap="1">
              <Text size="1" color="gray">
                {relation.prefix}
              </Text>
              <CodeLink
                code={ref.other}
                snap={relation.snap}
                color={colorOf.get(ref.other)}
                size="1"
              />
            </Flex>
          )}
          {relation && !ref.other && relation.none && (
            <Text size="1" color="gray">
              {relation.none}
            </Text>
          )}
        </Box>
      ))}
    </Box>
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
  const [isOpen, setIsOpen] = useState(false);
  const from = sourcesOf(row);
  const to = targetsOf(row);
  const details = useMemo(
    () => describeChangeRow(row, previousCodes, nextCodes),
    [row, previousCodes, nextCodes]
  );
  const showTargetHeaders = details.groups.length > 1;
  const toggle = () => setIsOpen((value) => !value);

  return (
    <Box
      className={styles.row}
      data-testid="axial-code-change-row"
      style={{ borderLeftColor: `var(--${CHANGE_KIND_META[row.kind].color}-9)` }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        className={styles.rowHeader}
        onClick={toggle}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
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
            <Text size="2" color="gray">
              —
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

        <Text size="1" weight="medium" className={styles.toggle}>
          {isOpen ? 'Hide' : 'Details'}
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms ease',
            }}
          />
        </Text>

        <Text
          size="1"
          color="gray"
          data-testid="axial-code-change-summary-text"
          style={{ gridColumn: '2 / -1', marginTop: 6 }}
        >
          {details.summary}
        </Text>
      </div>

      {isOpen && (
        <Box className={styles.details} data-testid="axial-code-change-details">
          {details.description && (
            <Flex direction="column" gap="1">
              <Text size="1" weight="bold" color="gray">
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
              <Box className={styles.columns}>
                <OpenCodeColumn
                  title={row.kind === 'new' ? 'Open codes' : 'Kept'}
                  tone="kept"
                  refs={group.kept}
                  openCodeTextById={openCodeTextById}
                  colorOf={colorOf}
                  relation={row.kind === 'merged' ? { prefix: 'from', snap: 'A' } : undefined}
                />
                <OpenCodeColumn
                  title="Joined"
                  tone="added"
                  refs={group.added}
                  openCodeTextById={openCodeTextById}
                  colorOf={colorOf}
                  relation={{ prefix: 'from', snap: 'A', none: 'Newly coded' }}
                />
                {!showTargetHeaders && (
                  <OpenCodeColumn
                    title={row.kind === 'removed' ? 'Went to' : 'Left'}
                    tone="left"
                    refs={details.left}
                    openCodeTextById={openCodeTextById}
                    colorOf={colorOf}
                    relation={{ prefix: 'to', snap: 'B', none: 'No longer in any code' }}
                  />
                )}
              </Box>
            </Flex>
          ))}

          {(showTargetHeaders || details.groups.length === 0) && (
            <Box className={styles.columns}>
              <OpenCodeColumn
                title={row.kind === 'removed' ? 'Went to' : 'Left'}
                tone="left"
                refs={details.left}
                openCodeTextById={openCodeTextById}
                colorOf={colorOf}
                relation={{ prefix: 'to', snap: 'B', none: 'No longer in any code' }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

/**
 * Lists every difference between the approved axial codes (version A) and the
 * regenerated ones (version B) in one place: what kind of change it is, a short
 * explanation, and, when a row is opened, which open codes were kept, joined or
 * left, including the removed codes, which have no card of their own.
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
            How the codes of version A became the codes of version B. Open a change to see its open
            codes, or click a code to find it in the list below.
          </Text>
        </Box>
        {unchangedCount > 0 && (
          <Button variant="ghost" size="1" onClick={() => setShowUnchanged((value) => !value)}>
            {showUnchanged ? 'Hide unchanged' : `Show unchanged (${unchangedCount})`}
          </Button>
        )}
      </Flex>

      {visibleRows.length === 0 ? (
        <Card size="2">
          <Text size="2" color="gray">
            The axial codes did not change.
          </Text>
        </Card>
      ) : (
        <Flex direction="column" gap="2">
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
        </Flex>
      )}

      {moved.length > 0 && (
        <Card size="2" mt="3">
          <Text as="div" size="1" weight="bold" color="gray" mb="2">
            All moved open codes · {moved.length}
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
                  columnGap: 12,
                }}
              >
                <Text size="2" style={{ overflowWrap: 'anywhere' }}>
                  {openCodeTextById[item.traceId] ?? item.traceId}
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
        </Card>
      )}
    </Box>
  );
}
