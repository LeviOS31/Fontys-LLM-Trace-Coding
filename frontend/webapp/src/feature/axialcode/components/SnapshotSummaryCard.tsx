import { Box, Card, Flex, Grid, Text } from '@radix-ui/themes';
import type { Snapshot } from '../../../shared/types/snapshot.ts';
import { colors } from '../../../shared/styling/colors.ts';

interface StatProps {
  readonly label: string;
  readonly value: string | number;
  readonly small?: boolean;
}

function Stat({ label, value, small }: StatProps) {
  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text
        size={small ? '3' : '5'}
        weight="bold"
        style={{
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </Text>
    </Flex>
  );
}

interface SnapshotSummaryCardProps {
  readonly snapshot: Snapshot;
  readonly isB?: boolean;
  readonly isComparison?: boolean;
}

export default function SnapshotSummaryCard({
  snapshot,
  isB,
  isComparison,
}: SnapshotSummaryCardProps) {
  const t = snapshot.totals;
  return (
    <Card size="2" style={{ position: 'relative' }}>
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 16,
          right: 16,
          height: 2,
          background: isB
            ? `var(--${colors.theme.radix.primary}-9)`
            : `var(--${colors.theme.radix.gray}-7)`,
          borderRadius: '0 0 2px 2px',
        }}
      />

      <Flex direction="column" gap="3" pt="2">
        <Text size="1" color="gray">
          {isComparison
            ? `${snapshot.label} · ${snapshot.generatedAt}`
            : `Version Date: ${snapshot.generatedAt}`}
        </Text>

        <Box pt="3" style={{ borderTop: '1px solid var(--gray-4)' }}>
          <Grid columns="3" gap="4">
            <Stat label="Axial codes" value={t.axialCodes} />
            <Stat label="Open codes" value={t.openCodes} />
            <Stat label="Avg open codes / code" value={t.avgOpenCodesPerCode} />
            <Box style={{ gridColumn: 'span 2' }}>
              <Stat label="Largest Axial Code" value={t.largestCategory} small />
            </Box>
          </Grid>
        </Box>
      </Flex>
    </Card>
  );
}
