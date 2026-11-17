import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
import { formatDate, type JudgeCollection } from '../hooks/judgeUtils';
import { SectionHead } from './Primitives';

type Props = {
  readonly collections: JudgeCollection[];
  readonly loading: boolean;
  readonly onSelect: (judgeCollectionId: string) => void;
};

export default function JudgeCollectionOverview({ collections, loading, onSelect }: Props) {
  return (
    <Box pb="9">
      <SectionHead
        title="Judge collections"
        subtitle="Select a collection to view its judge runs."
      />
      {collections.length === 0 ? (
        <Text as="p" size="2" color="gray">
          {loading
            ? 'Loading judge collections…'
            : 'No judge collections yet. Select a template above and run the judge.'}
        </Text>
      ) : (
        <Flex direction="column" gap="3">
          {collections.map((collection) => (
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
