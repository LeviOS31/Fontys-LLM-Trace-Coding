import { useMemo, useState } from 'react';
import { Flex, Select, Text, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import type { AxialCodeSnapshotCode } from '../../../shared/types/axialCodeSnapshotCode.ts';
import type { Snapshot } from '../../../shared/types/snapshot.ts';
import AxialCodeCard from './AxialCodeCard/AxialCodeCard.tsx';

type SortKey = 'openCodes' | 'prevalence' | 'name';

const SORTERS: Record<SortKey, (a: AxialCodeSnapshotCode, b: AxialCodeSnapshotCode) => number> = {
  openCodes: (a, b) => b.openCodeCount - a.openCodeCount,
  prevalence: (a, b) => b.prevalence - a.prevalence,
  name: (a, b) => a.name.localeCompare(b.name),
};

function matchesQuery(code: AxialCodeSnapshotCode, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    code.name,
    code.description,
    code.rationale,
    ...code.sampleOpenCodes,
    ...(code.justifications ?? []).flatMap((j) => [j.quote, j.justification]),
  ];
  return haystack.some((text) => text?.toLowerCase().includes(needle));
}

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
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('openCodes');

  const codes = useMemo(
    () => snapshot.codes.filter((code) => matchesQuery(code, query)).sort(SORTERS[sortKey]),
    [snapshot.codes, query, sortKey]
  );

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2" wrap="wrap">
        <TextField.Root
          placeholder="Search axial codes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search axial codes"
          style={{ flex: 1, minWidth: 180 }}
        >
          <TextField.Slot>
            <Search size={14} />
          </TextField.Slot>
        </TextField.Root>

        <Select.Root value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <Select.Trigger aria-label="Sort axial codes" />
          <Select.Content>
            <Select.Item value="openCodes">Most open codes</Select.Item>
            <Select.Item value="prevalence">Highest prevalence</Select.Item>
            <Select.Item value="name">Name (A–Z)</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Text size="1" color="gray">
        {isComparison ? `${snapshot.label} · ` : ''}
        {codes.length} of {snapshot.codes.length}
      </Text>

      {codes.length === 0 ? (
        <Text size="2" color="gray">
          No axial codes match “{query}”.
        </Text>
      ) : (
        <Flex direction="column" gap="2">
          {codes.map((code) => (
            <AxialCodeCard key={code.id} code={code} snap={isB ? 'B' : 'A'} onHover={onHover} />
          ))}
        </Flex>
      )}
    </Flex>
  );
}
