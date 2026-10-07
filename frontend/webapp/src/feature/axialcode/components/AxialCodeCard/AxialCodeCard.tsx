import { useState } from 'react';
import { Badge, Box, Card, Flex, Text } from '@radix-ui/themes';
import type { AxialCodeSnapshotCode } from '../../../../shared/types/axialCodeSnapshotCode.ts';
import { colors } from '../../../../shared/styling/colors.ts';
import styles from './AxialCodeCard.module.css';
import ChangeKindBadge from '../ChangeKindBadge.tsx';

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
        <Text size="1" color="gray">
          {prefix}{' '}
          <Text as="span" size="1" weight="bold" highContrast>
            {code.derivedFrom.join(', ')}
          </Text>
        </Text>
      )}
      {showCounts && (
        <Flex gap="2">
          {added > 0 && (
            <Text size="1" weight="bold" color="green">
              +{added} open code{added > 1 ? 's' : ''}
            </Text>
          )}
          {removed > 0 && (
            <Text size="1" weight="bold" color="red">
              −{removed} open code{removed > 1 ? 's' : ''}
            </Text>
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

  return (
    <Card
      size="1"
      className={styles.card}
      data-testid="axial-code-card"
      onMouseEnter={() => onHover?.({ ...code, _snap: snap })}
      onMouseLeave={() => onHover?.(null)}
    >
      <Flex gap="3" align="start">
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

          <Text size="2" color="gray" style={{ lineHeight: 1.5 }}>
            {code.description}
          </Text>

          <Flex gap="4">
            <Text size="1" color="gray">
              <Text as="span" size="1" weight="bold" highContrast>
                {code.prevalence}%
              </Text>{' '}
              prevalence
            </Text>
            <Text size="1" color="gray">
              <Text as="span" size="1" weight="bold" highContrast>
                {code.openCodeCount}
              </Text>{' '}
              open codes
            </Text>
          </Flex>

          <Box style={{ height: 3, background: 'var(--gray-3)', borderRadius: 2 }}>
            <Box
              style={{
                width: `${Math.min(100, code.prevalence * 3)}%`,
                height: '100%',
                background: code.color,
                borderRadius: 2,
              }}
            />
          </Box>

          {expanded && (
            <Flex
              direction="column"
              gap="2"
              pt="3"
              style={{ borderTop: '1px dashed var(--gray-5)' }}
            >
              <Text
                size="1"
                color="gray"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Open codes
              </Text>
              <Flex wrap="wrap" gap="1">
                {code.sampleOpenCodes.map((c, index) => (
                  <Badge key={`${c}-${index}`} variant="surface" color="gray" size="1">
                    {c}
                  </Badge>
                ))}
              </Flex>
            </Flex>
          )}

          <Text
            asChild
            size="1"
            weight="bold"
            style={{ color: `var(--${colors.theme.radix.primary}-11)`, cursor: 'pointer' }}
          >
            <button
              type="button"
              className={styles.textBtn}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? 'Collapse ↑' : 'Expand details ↓'}
            </button>
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
