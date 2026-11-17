import { useMemo, useState } from 'react';
import type { JudgeTemplate } from '../hooks/judgeUtils';
import { Button, Checkbox, Flex, Popover, Text, TextField } from '@radix-ui/themes';
import { ChevronDown, Search } from 'lucide-react';

type Props = {
  templates: JudgeTemplate[];
  onChange: (updatedIds: string[]) => void;
};

export default function JudgeTemplateSelect({ templates, onChange }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(query));
  }, [templates, search]);

  const isFiltering = search.trim().length > 0;

  // "Select all" reflects only what is currently visible
  const filteredSelectedCount = filteredTemplates.filter((t) => selectedIds.includes(t.id)).length;
  const allFilteredSelected =
    filteredTemplates.length > 0 && filteredSelectedCount === filteredTemplates.length;
  const someFilteredSelected = filteredSelectedCount > 0 && !allFilteredSelected;

  function update(ids: string[]) {
    setSelectedIds(ids);
    onChange(ids);
  }

  function toggleTemplate(id: string, checked: boolean) {
    update(checked ? [...selectedIds, id] : selectedIds.filter((selectedId) => selectedId !== id));
  }

  function toggleAllFiltered(checked: boolean) {
    const visibleIds = filteredTemplates.map((t) => t.id);
    if (checked) {
      update([...new Set([...selectedIds, ...visibleIds])]);
    } else {
      update(selectedIds.filter((id) => !visibleIds.includes(id)));
    }
  }

  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearch('');
  }

  const triggerLabel =
    selectedIds.length === 0
      ? 'Select templates'
      : selectedIds.length === 1
        ? (templates.find((t) => t.id === selectedIds[0])?.name ?? '1 selected')
        : `${selectedIds.length} templates selected`;

  return (
    <Flex align="end" gap="2" direction="column" style={{ width: '100%' }}>
      <div style={{ width: '50%', textAlign: 'center' }}>
        <Text size="5" weight="bold">
          Judge templates:
        </Text>
      </div>

      <div style={{ width: '50%' }}>
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
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search templates"
              >
                <TextField.Slot>
                  <Search height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
            </div>

            {filteredTemplates.length > 0 && (
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
                  cursor: 'pointer',
                }}
              >
                {isFiltering ? 'Select all results' : 'Select all'}
                <Checkbox
                  checked={
                    allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) => toggleAllFiltered(checked === true)}
                />
              </Text>
            )}

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredTemplates.length === 0 ? (
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
                  No templates match "{search.trim()}"
                </Text>
              ) : (
                filteredTemplates.map((t, index) => (
                  <Text
                    as="label"
                    size="2"
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) var(--space-3)',
                      background: index % 2 === 0 ? 'var(--gray-3)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {t.name}
                    <Checkbox
                      checked={selectedIds.includes(t.id)}
                      onCheckedChange={(checked) => toggleTemplate(t.id, checked === true)}
                    />
                  </Text>
                ))
              )}
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>
    </Flex>
  );
}
