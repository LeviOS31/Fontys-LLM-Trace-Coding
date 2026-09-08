import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, ChevronRight, Code2, GitBranch, LayoutDashboard, Scale } from 'lucide-react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { SidebarNavItem } from './SidebarNavItem.tsx';
import { colors } from '../../shared/styling/colors.ts';
import { isTyping } from '../../shared/util/shortcutHelpers.ts';
import type { Version } from '../../shared/types/version.ts';

interface VersionRowProps {
  readonly version: Version;
  readonly projectId: string;
  readonly isSelected: boolean;
  readonly isKeyFocused?: boolean;
}

const PAGES = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard, shortcut: '1' },
  { id: 'open-code', label: 'Open Code', Icon: Code2, shortcut: '2' },
  { id: 'axial-code', label: 'Axial Code', Icon: GitBranch, shortcut: '3' },
  { id: 'judge-template', label: 'Judge Template', Icon: Scale, shortcut: '4' },
] as const;

export function VersionRow({
  version,
  projectId,
  isSelected,
  isKeyFocused = false,
}: VersionRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isExpanded = isSelected;

  // Move DOM focus to this row when keyboard-navigated.
  // This updates an external system (DOM focus) — not React state.
  useEffect(() => {
    if (isKeyFocused) rowRef.current?.focus();
  }, [isKeyFocused]);

  // 1–4 navigate between pages within this version when it is active.
  useEffect(() => {
    if (!isSelected) return;
    const PAGE_KEYS: Record<string, string> = {
      '1': 'overview',
      '2': 'open-code',
      '3': 'axial-code',
      '4': 'judge-template',
    };
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      const page = PAGE_KEYS[e.key];
      if (!page) return;
      e.preventDefault();
      navigate(`/projects/${projectId}/versions/${version.versionId}/${page}`);
    };
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [isSelected, projectId, version.versionId, navigate]);

  return (
    <Box>
      <Flex
        ref={rowRef}
        role="button"
        tabIndex={0}
        align="center"
        gap="2"
        px="3"
        py="2"
        m="1"
        className="version-row"
        onClick={() => navigate(`/projects/${projectId}/versions/${version.versionId}/overview`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            navigate(`/projects/${projectId}/versions/${version.versionId}/overview`);
          }
        }}
        style={{
          borderRadius: 'var(--radius-3)',
          cursor: 'pointer',
          userSelect: 'none',
          outline: isKeyFocused ? '2px solid var(--accent-7)' : 'none',
          outlineOffset: -2,
          backgroundColor: isSelected ? 'var(--accent-3)' : undefined,
        }}
      >
        <GitBranch
          size={15}
          color={isSelected || isKeyFocused ? 'var(--accent-9)' : 'var(--gray-8)'}
          style={{ flexShrink: 0 }}
        />
        <Text
          as="span"
          size="2"
          weight="medium"
          color={isSelected ? colors.theme.radix.primary : colors.theme.radix.gray}
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {version.name}
        </Text>
        {isExpanded ? (
          <ChevronDown size={14} color="var(--gray-10)" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronRight size={14} color="var(--gray-8)" style={{ flexShrink: 0 }} />
        )}
      </Flex>

      {isExpanded && (
        <Box mb="1">
          {PAGES.map(({ id, label, Icon, shortcut }) => (
            <SidebarNavItem
              key={id}
              to={`/projects/${projectId}/versions/${version.versionId}/${id}`}
              label={label}
              icon={<Icon size={15} />}
              paddingLeft={42}
              shortcut={shortcut}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
