import { Box, Flex, Select, Text, TextField, Checkbox } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import { useGetTraceCollections } from '../../../opencode/hooks/useGetTraceCollections.ts';

interface TraceFilterBarProps {
  projectId: string;
  versionId: string;
  search: string;
  setSearch: (value: string) => void;
  collectionFilter: string;
  setCollectionFilter: (value: string) => void;
  hasNoOpenCode: boolean;
  setHasNoOpenCode: (value: boolean) => void;
  setSearchParams: (key: string, value: string | boolean | null) => void;
}
export default function TraceFilterBar({
  projectId,
  versionId,
  search,
  setSearch,
  collectionFilter,
  setCollectionFilter,
  hasNoOpenCode,
  setHasNoOpenCode,
  setSearchParams,
}: Readonly<TraceFilterBarProps>) {
  const { data, isLoading, isError } = useGetTraceCollections(projectId, versionId);
  const traceCollectionList = data ?? [];

  return (
    <Flex
      direction={{ initial: 'column', md: 'row' }}
      align={{ initial: 'start', md: 'stretch' }}
      gap="3"
      width="100%"
      mb="3"
    >
      <Box style={{ minWidth: '100px', maxWidth: '200px' }}>
        <Text size="1" color="gray" as="div" mb="1">
          Search
        </Text>
        <TextField.Root
          placeholder="Search traces..."
          size="2"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          disabled={true}
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
          disabled={(isLoading || isError || traceCollectionList.length === 0) && true}
          size="2"
        >
          <Select.Trigger
            placeholder={
              (isLoading && 'Loading...') ||
              (isError && 'Failed to load') ||
              'Select a trace collection'
            }
          />
          {!isLoading && !isError && (
            <Select.Content>
              <Select.Item value={'All'}>All</Select.Item>
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
          <Text color="red" size="2" mt="1">
            Could not load trace collections.
          </Text>
        )}
      </Box>
      <Box>
        <Text size="1" color="gray" as="div" mb="1">
          Axial Codes
        </Text>
        <Select.Root defaultValue="All" size="2" disabled={true}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="All">All</Select.Item>
            <Select.Item value="Hallucination">Hallucination</Select.Item>
            <Select.Item value="No Answer">No Answer</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>
      <Box style={{ display: 'flex', flexDirection: 'column' }}>
        <Text size="1" color="gray" as="div" mb="1">
          No Open code
        </Text>
        <Box style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Checkbox
            size={'3'}
            checked={hasNoOpenCode}
            onCheckedChange={(value) => {
              setHasNoOpenCode(value === true);
              setSearchParams('hasNoOpenCode', value);
            }}
            disabled={true}
          />
        </Box>
      </Box>
    </Flex>
  );
}
