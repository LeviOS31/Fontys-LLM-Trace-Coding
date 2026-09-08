import { Badge, Button, Flex, Text } from '@radix-ui/themes';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { TraceCollectionOverview } from '../../../shared/types/trace.ts';
import { formatTraceDate } from '../../../shared/util/formatTraceDate.ts';
import './CollectionListItem.css';
import { useState } from 'react';
import { EditTraceCollectionModal } from './EditTraceCollectionModal.tsx';

interface CollectionListItemProps {
  readonly collection: TraceCollectionOverview;
  readonly showDivider: boolean;
  readonly versionId: string;
  readonly projectId: string;
}

export default function CollectionListItem({
  collection,
  showDivider,
  versionId,
  projectId,
}: Readonly<CollectionListItemProps>) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(
      `/projects/${projectId}/versions/${versionId}/open-code?traceCollection=${collection.traceCollectionId}`
    );
  };

  return (
    <>
      <Flex
        align="center"
        justify="between"
        gap="4"
        py="3"
        onClick={handleClick}
        className="collection-list-item"
        style={{ borderBottom: showDivider ? '1px solid var(--gray-a4)' : undefined }}
      >
        <Flex align="center" gap="3">
          <Flex
            align="center"
            justify="center"
            className="collection-list-item__icon"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-2)',
              background: 'var(--gray-a3)',
              flexShrink: 0,
              transition: 'background 120ms ease',
            }}
          >
            <ArrowRightLeft size={14} style={{ color: 'var(--gray-11)' }} />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              {collection.name}
            </Text>
            <Text size="1" color="gray">
              Imported {formatTraceDate(collection.createdAt)}
            </Text>
          </Flex>
        </Flex>

        <Flex align="center" gap="4" style={{ flexShrink: 0 }}>
          <Badge variant="outline" color="gray" radius="full">
            {collection.tracersCount} traces
          </Badge>

          <Button
            variant="ghost"
            color="gray"
            aria-label="Edit trace collection"
            onClick={(e) => {
              e.stopPropagation();
              setEditDialogOpen(true);
            }}
          >
            <Pencil size={18} />
          </Button>
        </Flex>
      </Flex>

      <EditTraceCollectionModal
        key={collection.traceCollectionId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        projectId={projectId}
        projectVersionId={versionId}
        collectionId={collection.traceCollectionId}
        collectionName={collection.name}
      />
    </>
  );
}
