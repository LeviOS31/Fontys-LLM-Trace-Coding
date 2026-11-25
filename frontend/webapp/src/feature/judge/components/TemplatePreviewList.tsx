import { useState } from 'react';
import { Box, Button, Flex } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import type { JudgeTemplate } from '../hooks/judgeUtils';

type Props = {
  readonly templates: JudgeTemplate[];
  readonly onEdit: (templateId: string) => void;
};

export default function TemplatePreviewList({ templates, onEdit }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Flex direction="column" gap="2">
      {templates.map((t) => {
        const open = openId === t.id;
        return (
          <Box
            key={t.id}
            style={{
              border: '1px solid var(--gray-a5)',
              borderRadius: 'var(--radius-3)',
              padding: '8px 12px',
              background: 'var(--color-panel)',
            }}
          >
            <Flex align="center" justify="between" gap="3">
              <Button variant="ghost" color="gray" size="2" onClick={() => setOpenId(open ? null : t.id)}>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {t.name}
              </Button>
              <Button variant="ghost" size="2" onClick={() => onEdit(t.id)}>
                <Pencil size={14} />
                Edit
              </Button>
            </Flex>
            {open && (
              <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-1)' }}>
                {t.template}
              </pre>
            )}
          </Box>
        );
      })}
    </Flex>
  );
}