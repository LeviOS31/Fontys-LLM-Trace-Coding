import { useState } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import type { AxialCodeSnapshotCode } from '../../../../shared/types/axialCodeSnapshotCode.ts';
import { colors } from '../../../../shared/styling/colors.ts';
import styles from './AxialCodeCard.module.css';
import ChangeKindBadge from '../ChangeKindBadge.tsx';
import AxialCodeDetails from '../AxialCodeDetails.tsx';

const ORIGIN_PREFIX: Partial<Record<NonNullable<AxialCodeSnapshotCode['changeKind']>, string>> = {
  renamed: 'Was',
  merged: 'Merged from',
  split: 'Split from',
};

/** Where a regenerated code comes from and how many open codes it gained or lost. */
function ChangeDetails({ code }: { readonly code: AxialCodeSnapshotCode }) {
  const prefix = code.changeKind ? ORIGIN_PREFIX[code.changeKind] : undefined;
  const added = code.addedTraceIds?.length ?? 0;
  const removed = code.removedTraceIds?.length ?? 0;
  const showCounts = code.changeKind !== 'new' && (added > 0 || removed > 0);

  if (!prefix && !showCounts) return null;

  return (
    <Flex direction="column" gap="1">
      {prefix && code.derivedFrom && code.derivedFrom.length > 0 && (
        <Text size="1">
          {prefix}{' '}
          <Text as="span" size="1" weight="bold">
            {code.derivedFrom.join(', ')}
          </Text>
        </Text>
      )}
      {showCounts && (
        <Flex gap="3">
          {added > 0 && (
            <Flex align="center" gap="1">
              <Plus size={12} color="var(--green-11)" aria-hidden />
              <Text size="1" weight="bold" color="green">
                {added} open code{added > 1 ? 's' : ''}
              </Text>
            </Flex>
          )}
          {removed > 0 && (
            <Flex align="center" gap="1">
              <Minus size={12} color="var(--red-11)" aria-hidden />
              <Text size="1" weight="bold" color="red">
                {removed} open code{removed > 1 ? 's' : ''}
              </Text>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
}

interface AxialCodeCardProps {
  readonly code: AxialCodeSnapshotCode;
  readonly onHover?: (code: (AxialCodeSnapshotCode & { _snap: string }) | null) => void;
  readonly snap: 'A' | 'B';
}

export default function AxialCodeCard({ code, onHover, snap }: AxialCodeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Chevron = expanded ? ChevronUp : ChevronDown;

  const prevalence = Math.min(100, Math.max(0, code.prevalence));

  return (
    <Card
      size="1"
      className={styles.card}
      data-testid="axial-code-card"
      data-snap={snap}
      data-axial-code-name={code.name}
      onMouseEnter={() => onHover?.({ ...code, _snap: snap })}
      onMouseLeave={() => onHover?.(null)}
    >
      <Flex gap="3" align="start">
        {/* Vertical ranking-based color indicator */}
        <Box
          style={{
            width: 3,
            alignSelf: 'stretch',
            background: code.color,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />

        <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="2" wrap="wrap">
            <Text size="2" weight="bold" style={{ letterSpacing: '-0.005em' }}>
              {code.name}
            </Text>
            {code.changeKind && <ChangeKindBadge kind={code.changeKind} />}
          </Flex>

          {code.changeKind && <ChangeDetails code={code} />}

          <Text size="2" style={{ lineHeight: 1.5 }}>
            {code.description}
          </Text>

          <Flex gap="4">
            <Text size="1">
              <Text as="span" size="1" weight="bold">
                {code.prevalence}%
              </Text>{' '}
              prevalence
            </Text>
            <Text size="1">
              <Text as="span" size="1" weight="bold">
                {code.openCodeCount}
              </Text>{' '}
              open codes
            </Text>
          </Flex>

          {/* Horizontal prevalence bar using the ranking-based color */}
          <Box
            style={{
              height: 3,
              background: 'var(--gray-3)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                width: `${prevalence}%`,
                height: '100%',
                background: code.color,
                borderRadius: 2,
                transition: 'width 200ms ease',
              }}
            />
          </Box>

          {expanded && <AxialCodeDetails code={code} />}

          <Text
            asChild
            size="1"
            weight="bold"
            style={{ color: `var(--${colors.theme.radix.primary}-11)`, cursor: 'pointer' }}
          >
            <button
              type="button"
              className={styles.textBtn}
              aria-expanded={expanded}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? 'Collapse' : 'Expand details'}
              <Chevron size={14} aria-hidden />
            </button>
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
