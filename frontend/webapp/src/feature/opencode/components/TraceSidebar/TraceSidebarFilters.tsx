import { Box, Checkbox, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import { useGetTraceCollections } from '../../hooks/useGetTraceCollections.ts';

interface Props {
  readonly projectId: string;
  readonly versionId: string;
  readonly search: string;
  readonly setSearch: (value: string) => void;
  readonly collectionFilter: string;
  readonly setCollectionFilter: (value: string) => void;
  readonly hasNoOpenCode: boolean;
  readonly setHasNoOpenCode: (value: boolean) => void;
  readonly setSearchParams: (key: string, value: string | boolean | null) => void;
}

export default function TraceSidebarFilters({
  projectId,
  versionId,
  search,
  setSearch,
  collectionFilter,
  setCollectionFilter,
  hasNoOpenCode,
  setHasNoOpenCode,
  setSearchParams,
}: Readonly<Props>) {
  const { data, isLoading, isError } = useGetTraceCollections(projectId, versionId);
  const traceCollectionList = data ?? [];

  return (
    <Flex direction="column" gap="2" px="3" pb="3" style={{ flexShrink: 0 }}>
      <Box>
        <Text size="1" color="gray" as="div" mb="1">
          Search
        </Text>
        <TextField.Root
          placeholder="Search traces..."
          size="2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        >
          <TextField.Slot>
            <Search size={12} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      <Box>
        <Text size="1" color="gray" as="div" mb="1">
          Collection
        </Text>
        <Select.Root
          value={collectionFilter}
          onValueChange={(value) => {
            setCollectionFilter(value);
            setSearchParams('traceCollection', value);
          }}
          disabled={isLoading || isError || traceCollectionList.length === 0}
          size="2"
        >
          <Select.Trigger
            style={{ width: '100%' }}
            placeholder={
              (isLoading && 'Loading...') ||
              (isError && 'Failed to load') ||
              'Select a trace collection'
            }
          />
          {!isLoading && !isError && (
            <Select.Content>
              <Select.Item value="All">All</Select.Item>
              {traceCollectionList.map((traceCollection) => (
                <Select.Item
                  key={traceCollection.traceCollectionId}
                  value={traceCollection.traceCollectionId}
                >
                  {traceCollection.name}
                </Select.Item>
              ))}
            </Select.Content>
          )}
        </Select.Root>
        {isError && (
          <Text color="red" size="1" mt="1">
            Could not load trace collections.
          </Text>
        )}
      </Box>

      <Text as="label" size="1" color="gray">
        <Flex align="center" gap="2">
          <Checkbox
            size="2"
            checked={hasNoOpenCode}
            onCheckedChange={(value) => {
              setHasNoOpenCode(value === true);
              setSearchParams('hasNoOpenCode', value);
            }}
          />
          No Open code
        </Flex>
      </Text>
    </Flex>
  );
}
