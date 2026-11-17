import { useState } from 'react';
import { Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { ChevronRight, Pencil } from 'lucide-react';
import { formatDate, type JudgeCollection } from '../hooks/judgeUtils';
import { SectionHead } from './Primitives';

type Props = {
  readonly collections: JudgeCollection[];
  readonly loading: boolean;
  readonly onSelect: (judgeCollectionId: string) => void;
  readonly onRename: (judgeCollectionId: string, name: string) => Promise<boolean>;
};

export default function JudgeCollectionOverview({
  collections,
  loading,
  onSelect,
  onRename,
}: Props) {
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const beginEditing = (collection: JudgeCollection) => {
    setEditingCollectionId(collection.judgeCollectionId);
    setNameDraft(collection.name);
  };

  const cancelEditing = () => {
    setEditingCollectionId(null);
    setNameDraft('');
  };

  const saveName = async (judgeCollectionId: string) => {
    const name = nameDraft.trim();
    if (!name || saving) return;

    setSaving(true);
    try {
      if (await onRename(judgeCollectionId, name)) {
        cancelEditing();
      }
    } finally {
      setSaving(false);
    }
  };

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
          {collections.map((collection) => {
            const isEditing = editingCollectionId === collection.judgeCollectionId;

            return (
              <Card key={collection.judgeCollectionId}>
                <Flex align="center" justify="between" gap="3">
                  {isEditing ? (
                    <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
                      <TextField.Root
                        aria-label="Collection name"
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        style={{ flexGrow: 1 }}
                      />
                      <Button
                        type="button"
                        size="2"
                        onClick={() => saveName(collection.judgeCollectionId)}
                        disabled={!nameDraft.trim() || saving}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="2"
                        variant="soft"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </Flex>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Open ${collection.name}`}
                      onClick={() => onSelect(collection.judgeCollectionId)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: 0,
                        padding: 0,
                        background: 'transparent',
                        color: 'inherit',
                      }}
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
                  )}
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      color="gray"
                      size="2"
                      aria-label={`Edit ${collection.name}`}
                      onClick={() => beginEditing(collection)}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                  )}
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}
