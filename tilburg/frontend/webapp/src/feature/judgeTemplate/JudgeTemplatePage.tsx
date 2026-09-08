import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Box, Flex, Kbd, Text, TextField } from '@radix-ui/themes';
import { Scale, Search } from 'lucide-react';
import type { JudgeTemplate } from '../../shared/types/judgeTemplate.ts';
import { useGetJudgeTemplates } from './hooks/useGetJudgeTemplates.ts';
import { useCreateJudgeTemplate } from './hooks/useCreateJudgeTemplate.ts';
import { useDeleteJudgeTemplate } from './hooks/useDeleteJudgeTemplate.ts';
import { useGetCurrentAxialCodesOfVersion } from '../axialcode/hooks/useGetCurrentAxialCodesOfVersion.ts';
import { isTyping } from '../../shared/util/shortcutHelpers.ts';
import { CreateTemplatePanel } from './components/CreateTemplatePanel/CreateTemplatePanel.tsx';
import { JudgeTemplateList } from './components/JudgeTemplateList/JudgeTemplateList.tsx';
import { EditJudgeTemplateModal } from './components/EditJudgeTemplateModal.tsx';

type PageParams = { id: string; versionId: string };

export default function JudgeTemplatePage() {
  const { id: projectId, versionId } = useParams<PageParams>();

  const [editing, setEditing] = useState<JudgeTemplate | null>(null);
  const [query, setQuery] = useState('');
  const [scopeAxial, setScopeAxial] = useState('all');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const axialSelectRef = useRef<HTMLSelectElement>(null);

  const { data: judgeTemplatesData } = useGetJudgeTemplates(projectId ?? '', versionId ?? '');
  const { data: axialCodesData } = useGetCurrentAxialCodesOfVersion(
    projectId ?? '',
    versionId ?? '',
    Boolean(projectId && versionId)
  );
  const { mutate: deleteTemplate } = useDeleteJudgeTemplate(projectId ?? '', versionId ?? '');
  const { mutate: generate, isPending: isCreating } = useCreateJudgeTemplate(
    projectId ?? '',
    versionId ?? ''
  );

  const templates = judgeTemplatesData?.judgeTemplates ?? [];
  const axialCodes = axialCodesData?.axialCodes ?? [];

  // The GET /judge-templates response does not include axialCodeId per template yet.
  const axialCodeById: Record<string, string> = {};

  const filtered = templates.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const handleDelete = (id: string) => {
    deleteTemplate(id, {
      onSuccess: () => {
        if (editing?.id === id) setEditing(null);
      },
    });
  };

  const handleCreate = () => {
    if (scopeAxial === 'all') return;
    const axial = axialCodes.find((a) => a.axialCodeId === scopeAxial);
    if (!axial?.axialCodeId) return;
    generate({
      axialCodeId: axial.axialCodeId,
      name: `Judge template - ${axial.label}`,
      description: axial.description,
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (editing) return;
      if (isTyping()) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === 'Enter' && focusedIndex >= 0 && filtered[focusedIndex]) {
        e.preventDefault();
        setEditing(filtered[focusedIndex]);
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const template = filtered[focusedIndex];
        if (focusedIndex >= 0 && template) {
          const blob = new Blob([template.template], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${template.name}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
        return;
      }
      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const select = axialSelectRef.current;
        if (select) {
          select.focus();
          // showPicker() opens the dropdown — requires a user-gesture context (keypress qualifies)
          if ('showPicker' in select)
            (select as HTMLSelectElement & { showPicker(): void }).showPicker();
        }
      }
    };
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [editing, filtered, focusedIndex]);

  if (!projectId || !versionId) return <Navigate to="/404" replace />;

  return (
    <Flex direction="column" gap="4">
      {/* Header */}
      <Flex align="start" justify="between">
        <Box>
          <Flex align="center" gap="2">
            <Scale size={20} />
            <Text size="6" weight="bold">
              Judge Template
            </Text>
          </Flex>
        </Box>
      </Flex>

      <CreateTemplatePanel
        axialCodes={axialCodes}
        scopeAxial={scopeAxial}
        onScopeChange={setScopeAxial}
        onCreate={handleCreate}
        isCreating={isCreating}
        selectRef={axialSelectRef}
      />

      {/* Search */}
      <Box style={{ maxWidth: 420 }}>
        <TextField.Root
          placeholder="Search judge templates…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        >
          <TextField.Slot>
            <Search size={14} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      <Box>
        <JudgeTemplateList
          templates={filtered}
          axialCodeById={axialCodeById}
          focusedIndex={focusedIndex}
          onOpen={(t) => {
            setEditing(t);
            setFocusedIndex(filtered.indexOf(t));
          }}
          onDelete={handleDelete}
        />
      </Box>

      {editing && (
        <EditJudgeTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onDelete={handleDelete}
        />
      )}

      {/* Keyboard shortcuts legend */}
      <Flex
        gap="4"
        wrap="wrap"
        mt="2"
        style={{ borderTop: '1px solid var(--gray-a4)', paddingTop: 'var(--space-3)' }}
      >
        {[
          { keys: ['↑', '↓'], label: 'Navigate list' },
          { keys: ['↵'], label: 'Open template' },
          { keys: ['A'], label: 'Pick axial code' },
          { keys: ['Ctrl', 'D'], label: 'Download template' },
        ].map(({ keys, label }) => (
          <Flex key={label} align="center" gap="1">
            {keys.map((k) => (
              <Kbd key={k} size="1">
                {k}
              </Kbd>
            ))}
            <Text size="1" color="gray" ml="1">
              {label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}
