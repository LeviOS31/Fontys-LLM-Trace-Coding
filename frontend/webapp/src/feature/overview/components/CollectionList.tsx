import { Box, Flex, Skeleton, Text, Button, Kbd } from '@radix-ui/themes';
import type { TraceCollectionOverview } from '../../../shared/types/trace.ts';
import CollectionListItem from './CollectionListItem.tsx';
import ImportTraceCollectionModal from '../../traces/components/ImportTraceCollectionModal.tsx';
import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';

interface Props {
  readonly collections: TraceCollectionOverview[] | undefined;
  readonly isLoading: boolean;
  readonly projectId: string;
  readonly projectVersionId: string;
}

export default function CollectionList({
  collections,
  isLoading,
  projectId,
  projectVersionId,
}: Props) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;

      // I → Open Import Modal
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsImportModalOpen(true);
      }
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, []);
  return (
    <Box
      p="4"
      style={{
        borderRadius: 'var(--radius-4)',
        border: '1px solid var(--gray-a4)',
        background: 'var(--color-background)',
      }}
    >
      <Flex>
        <Text size="4" weight="bold" mb="3" as="div">
          Collections
        </Text>
        <Button
          variant="soft"
          onClick={() => setIsImportModalOpen(true)}
          disabled={isLoading || !collections}
          style={{ marginLeft: 'auto' }}
        >
          <Upload size={16} /> Import trace collection{' '}
          <Kbd size="1" style={{ opacity: 0.6 }}>
            I
          </Kbd>
        </Button>
      </Flex>

      {isLoading && (
        <Flex direction="column" gap="3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height="48px" />
          ))}
        </Flex>
      )}

      {!isLoading && (!Array.isArray(collections) || collections.length === 0) && (
        <Text size="2" color="gray">
          No collections imported yet.
        </Text>
      )}

      {!isLoading &&
        Array.isArray(collections) &&
        collections.map((collection, i, arr) => (
          <CollectionListItem
            key={collection.traceCollectionId}
            collection={collection}
            showDivider={i < arr.length - 1}
            projectId={projectId}
            versionId={projectVersionId}
          />
        ))}

      <ImportTraceCollectionModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        projectVersionId={projectVersionId}
        projectId={projectId}
      />
    </Box>
  );
}
