import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Flex, Popover, Text, TextField } from '@radix-ui/themes';
import { ChevronDown, Search } from 'lucide-react';
import { BASE_URL } from '../../../shared/api/api';

type TraceCollection = { traceCollectionId: string; name: string; tracersCount: number };

type Props = {
  projectId?: string;
  versionId?: string;
  onChange: (ids: string[]) => void;
};

export default function TraceCollectionSelect({ projectId, versionId, onChange }: Props) {
  const [collections, setCollections] = useState<TraceCollection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!projectId || !versionId) return;
    fetch(new URL(`/v1/projects/${projectId}/versions/${versionId}/traces/collections`, BASE_URL))
      .then((r) => r.json())
      .then((d: { traceCollections?: TraceCollection[] }) => setCollections(d.traceCollections ?? []));
  }, [projectId, versionId]);

  const filteredCollections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(query));
  }, [collections, search]);

  const isFiltering = search.trim().length > 0;

  // Only collections with tracers > 0 are selectable
  const selectableFiltered = useMemo(
    () => filteredCollections.filter((c) => c.tracersCount > 0),
    [filteredCollections]
  );

  const filteredSelectedCount = selectableFiltered.filter((c) =>
    selectedIds.includes(c.traceCollectionId)
  ).length;

  const allFilteredSelected =
    selectableFiltered.length > 0 && filteredSelectedCount === selectableFiltered.length;
  const someFilteredSelected = filteredSelectedCount > 0 && !allFilteredSelected;

  function update(ids: string[]) {
    setSelectedIds(ids);
    onChange(ids);
  }

  function toggleCollection(id: string, checked: boolean) {
    update(checked ? [...selectedIds, id] : selectedIds.filter((selectedId) => selectedId !== id));
  }

  function toggleAllFiltered(checked: boolean) {
    const visibleSelectableIds = selectableFiltered.map((c) => c.traceCollectionId);
    if (checked) {
      update([...new Set([...selectedIds, ...visibleSelectableIds])]);
    } else {
      update(selectedIds.filter((id) => !visibleSelectableIds.includes(id)));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearch('');
  }

  const triggerLabel =
    selectedIds.length === 0
      ? 'Select trace collections'
      : selectedIds.length === 1
        ? (collections.find((c) => c.traceCollectionId === selectedIds[0])?.name ?? '1 selected')
        : `${selectedIds.length} collections selected`;

  return (
          <Flex
      align="start"
      gap="2"
      direction="column"
      style={{ width: '100%', pointerEvents: 'none' }}
    >
      <div style={{ width: 'calc(50% - var(--space-3))', textAlign: 'center', pointerEvents: 'auto' }}>
      <Text size="5" weight="bold">
        Trace collections:
      </Text>
      </div>

<div style={{ width: 'calc(50% - var(--space-3))', pointerEvents: 'auto' }}>
  <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <Popover.Trigger>
            <Button
              variant="surface"
              color="gray"
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>{triggerLabel}</span>
              <ChevronDown
                size={16}
                aria-hidden
                style={{
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              />
            </Button>
          </Popover.Trigger>

          <Popover.Content
            style={{
              width: 'var(--radix-popover-trigger-width)',
              padding: 0,
            }}
          >
            <div
              style={{
                padding: 'var(--space-2)',
                borderBottom: '1px solid var(--gray-5)',
              }}
            >
              <TextField.Root
                placeholder="Search collections…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search collections"
              >
                <TextField.Slot>
                  <Search height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
            </div>

            {filteredCollections.length > 0 && (
              <Text
                as="label"
                size="2"
                weight="medium"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-2) var(--space-3)',
                  borderBottom: '1px solid var(--gray-5)',
                  cursor: selectableFiltered.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {isFiltering ? 'Select all results' : 'Select all'}
                <Checkbox
                  disabled={selectableFiltered.length === 0}
                  checked={
                    allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) => toggleAllFiltered(checked === true)}
                />
              </Text>
            )}

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredCollections.length === 0 ? (
                <Text
                  as="p"
                  size="2"
                  color="gray"
                  style={{
                    margin: 0,
                    padding: 'var(--space-3)',
                    textAlign: 'center',
                  }}
                >
                  No collections match "{search.trim()}"
                </Text>
              ) : (
                filteredCollections.map((c, index) => {
                  const isDisabled = c.tracersCount === 0;
                  return (
                    <Text
                      as="label"
                      size="2"
                      key={c.traceCollectionId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-2) var(--space-3)',
                        background: index % 2 === 0 ? 'var(--gray-3)' : 'transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1,
                      }}
                    >
                      {c.name} ({c.tracersCount})
                      <Checkbox
                        disabled={isDisabled}
                        checked={selectedIds.includes(c.traceCollectionId)}
                        onCheckedChange={(checked) =>
                          toggleCollection(c.traceCollectionId, checked === true)
                        }
                      />
                    </Text>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>
    </Flex>
  );
}