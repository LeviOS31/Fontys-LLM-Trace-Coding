import { useMemo } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import type { AxialCodeSnapshotCode } from '../../../shared/types/axialCodeSnapshotCode.ts';
import type { Snapshot } from '../../../shared/types/snapshot.ts';
import AxialCodeCard from './AxialCodeCard/AxialCodeCard.tsx';

interface AxialCodeListProps {
  readonly snapshot: Snapshot;
  readonly isB?: boolean;
  readonly isComparison?: boolean;
  readonly onHover?: (code: (AxialCodeSnapshotCode & { _snap: string }) | null) => void;
}

export default function AxialCodeList({
  snapshot,
  isB,
  isComparison,
  onHover,
}: AxialCodeListProps) {
  const codes = useMemo(() => {
    return [...snapshot.codes];
  }, [snapshot.codes]);

  return (
    <Flex direction="column" gap="3">
      {isComparison && (
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="1" color="gray" style={{ flex: 1 }}>
            {snapshot.label} · {codes.length} of {snapshot.codes.length}
          </Text>
        </Flex>
      )}

      <Flex direction="column" gap="2">
        {codes.map((code) => (
          <AxialCodeCard key={code.id} code={code} snap={isB ? 'B' : 'A'} onHover={onHover} />
        ))}
      </Flex>
    </Flex>
  );
}
