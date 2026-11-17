import { useMemo, useState } from 'react';
import { AlertDialog, Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { ChevronRight, Pencil, Search, Trash2 } from 'lucide-react';
import { formatDate, type JudgeCollection } from '../hooks/judgeUtils';
import { SectionHead } from './Primitives';
import { Select } from 'radix-ui';

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
  readonly onRename: (judgeCollectionId: string, name: string) => Promise<boolean>;
  readonly onDelete: (judgeCollectionId: string) => Promise<boolean>;
};

export default function JudgeCollectionOverview({
  collections,
  loading,
  onSelect,
  onRename,
  onDelete,
}: Props) {
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JudgeCollection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      if (await onDelete(deleteTarget.judgeCollectionId)) {
        setDeleteTarget(null);
      } else {
        setDeleteError(true);
      }
    } finally {
      setDeleting(false);
    }
  };

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
          {collections.map((collection) => {
            const isEditing = editingCollectionId === collection.judgeCollectionId;

            return (
              <Card key={collection.judgeCollectionId}>
                <Flex align="center" justify="between" gap="3" wrap="wrap">
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
                        flex: '1 1 14rem',
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
                    <Flex gap="2" wrap="wrap" style={{ flexShrink: 0, marginLeft: 'auto' }}>
                      <Button
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="2"
                        aria-label={`Edit ${collection.name}`}
                        onClick={() => beginEditing(collection)}
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        color="red"
                        size="2"
                        aria-label={`Delete ${collection.name}`}
                        onClick={() => {
                          setDeleteError(false);
                          setDeleteTarget(collection);
                        }}
                        style={{ margin: 0, whiteSpace: 'nowrap' }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setDeleteError(false);
          }
        }}
      >
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Delete judge collection?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            This will permanently delete “{deleteTarget?.name}” and all of its judge runs. This
            action cannot be undone.
          </AlertDialog.Description>
          {deleteError && (
            <Text as="p" size="2" color="red" role="alert" mt="3">
              Could not delete the collection. Please try again.
            </Text>
          )}
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleting}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="solid"
              color="red"
              onClick={confirmDelete}
              disabled={deleting}
            >
              Delete collection
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
