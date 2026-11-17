import { Box, Card, Flex,Select, Text, TextField } from '@radix-ui/themes';
import { ChevronRight, Search } from 'lucide-react';
import { formatDate, type JudgeCollection } from '../hooks/judgeUtils';
import { SectionHead } from './Primitives';
import { useMemo, useState } from 'react';

type SortKey = 'runs'|'traces'|'succes'|'fail'|'name';

  // openCodes: (a, b) => b.openCodeCount - a.openCodeCount,
  // prevalence: (a, b) => b.prevalence - a.prevalence,
const SORTERS: Record<SortKey, (a: JudgeCollection, b: JudgeCollection) => number> = {
  runs: (a, b) => b.runCount - a.runCount,
  traces: (a, b) => b.traceCount - a.traceCount,
  succes: (a, b) => b.succesCount - a.succesCount,
  fail: (a, b) => b.failCount - a.failCount,
  name: (a, b) => a.name.localeCompare(b.name),
};

function matchesQuery(collection: JudgeCollection, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    collection.name,
  ];
  return haystack.some((text) => text?.toLowerCase().includes(needle));
}

type Props = {
  readonly collections: JudgeCollection[];
  readonly loading: boolean;
  readonly onSelect: (judgeCollectionId: string) => void;
};

export default function JudgeCollectionOverview({ collections, loading, onSelect }: Props) {

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  
  const collectionsfiltered = useMemo(
    () => collections.filter((collection) => matchesQuery(collection, query)).sort(SORTERS[sortKey]),
    [collections, query, sortKey]
  );

  return (
    <Box pb="9">
      <SectionHead
        title="Judge collections"
        subtitle="Select a collection to view its judge runs."
      />

      <Flex align="center" gap="2" wrap="wrap"
      style={{marginBottom: 20}}
      >
        <TextField.Root
          placeholder="Search judge collections…"
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
            <Select.Item value="name">Name (A–Z)</Select.Item>
            <Select.Item value="runs">Run count</Select.Item>
            <Select.Item value="traces">Trace count</Select.Item>
            <Select.Item value="succes">True Trace count</Select.Item>
            <Select.Item value="fail">False Trace count</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>
      {collections.length === 0 ? (
        <Text as="p" size="2" color="gray">
          {loading
            ? 'Loading judge collections…'
            : 'No judge collections yet. Select a template above and run the judge.'}
        </Text>
      ) : collectionsfiltered.length === 0 ? (
        <Text size="2" color="gray">
          No judge collections match “{query}”.
        </Text>
      ) : (
        <Flex direction="column" gap="3">
          {collectionsfiltered.map((collection) => (
            <Card key={collection.judgeCollectionId} asChild>
              <button
                type="button"
                onClick={() => onSelect(collection.judgeCollectionId)}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <Flex align="center" justify="between" gap="3">
                  <Box>
                    <Text as="p" size="3" weight="bold">
                      {collection.name}
                    </Text>
                    <Text as="p" size="1" color="gray" mt="1">
                      {formatDate(collection.createdAt)}
                    </Text>
                  </Box>
                  <ChevronRight size={18} />
                </Flex>
              </button>
            </Card>
          ))}
        </Flex>
      )}
    </Box>
  );
}
