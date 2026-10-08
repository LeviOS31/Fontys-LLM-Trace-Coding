import { useMemo, useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import type {
  AxialCodeChange,
  AxialCodeComparison,
} from '../../../../shared/util/compareAxialCodes.ts';
import ChangeKindBadge from '../ChangeKindBadge.tsx';
import { buildChangeRows, type ChangeRow } from './buildChangeRows.ts';
import styles from './ChangesSection.module.css';

// Moved open codes shown before the list is expanded.
const MOVED_PREVIEW = 5;

interface ChangesSectionProps {
  readonly comparison: AxialCodeComparison;
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
}: {
  readonly code: AxialCode;
  readonly snap: 'A' | 'B';
  readonly color: string | undefined;
}) {
  return (
    <button
      type="button"
      className={styles.codeLink}
      onClick={() => scrollToCard(code.label, snap)}
      title={`Show "${code.label}" in the version ${snap} list below`}
    >
      <Box style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: color }} />
      <Text size="2" weight="medium" className={styles.label} style={{ overflowWrap: 'anywhere' }}>
        {code.label}
      </Text>
      <ArrowDownToLine size={13} className={styles.icon} aria-hidden />
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

/** The version A codes of a row (left column). */
function sourcesOf(row: ChangeRow): readonly AxialCode[] {
  switch (row.kind) {
    case 'merged':
      return row.from;
    case 'split':
    case 'removed':
      return [row.from];
    default:
      return row.from ? [row.from] : [];
  }
}

/** The version B codes of a row (right column). */
function targetsOf(row: ChangeRow): readonly AxialCodeChange[] {
  switch (row.kind) {
    case 'removed':
      return [];
    case 'split':
      return row.to;
    default:
      return [row.to];
  }
}

function ChangeRowView({
  row,
  colorOf,
}: {
  readonly row: ChangeRow;
  readonly colorOf: ReadonlyMap<AxialCode, string>;
}) {
  const from = sourcesOf(row);
  const to = targetsOf(row);

  return (
    <Box
      data-testid="axial-code-change-row"
      py="2"
      style={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr) 20px minmax(0, 1fr)',
        alignItems: 'start',
        columnGap: 12,
        borderTop: '1px solid var(--gray-a4)',
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
        {row.kind === 'removed' && (
          <Text size="1" color="gray">
            {openCodes(row.from.traceIds.length)}
          </Text>
        )}
      </Flex>

      <Box pt="1" style={{ color: 'var(--gray-9)' }}>
        {to.length > 0 && <ArrowRight size={16} />}
      </Box>

      <Flex direction="column" gap="1" pt="1">
        {to.map((change) => (
          <Flex key={change.code.label} align="center" justify="between" gap="3" wrap="wrap">
            <CodeLink code={change.code} snap="B" color={colorOf.get(change.code)} />
            <OpenCodeDelta change={change} />
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

/**
 * Lists every difference between the approved axial codes (version A) and the
 * regenerated ones (version B) in one place, including the removed codes and the
 * open codes that moved to another code, which have no card of their own.
 */
export default function ChangesSection({
  comparison,
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
            How the codes of version A became the codes of version B. Click a code to find it in the
            list below.
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
          <Box style={{ marginTop: -9 }}>
            {visibleRows.map((row, index) => (
              <ChangeRowView key={`${row.kind}-${index}`} row={row} colorOf={colorOf} />
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
              Moved open codes ({moved.length})
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
