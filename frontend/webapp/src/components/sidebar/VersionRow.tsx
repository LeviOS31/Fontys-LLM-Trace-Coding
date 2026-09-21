import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChevronDown, ChevronRight, Code2, GitBranch, LayoutDashboard, Scale } from 'lucide-react';
import { Box, Flex, Text, Tooltip } from '@radix-ui/themes';
import { SidebarNavItem } from './SidebarNavItem.tsx';
import { colors } from '../../shared/styling/colors.ts';
import { isTyping } from '../../shared/util/shortcutHelpers.ts';
import type { Version } from '../../shared/types/version.ts';
import { useSidebarScrollContainer } from './SidebarScrollContent.ts';

interface VersionRowProps {
  readonly collapsed?: boolean;
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
  collapsed = false,
  version,
  projectId,
  isSelected,
  isKeyFocused = false,
}: VersionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const interactiveRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useSidebarScrollContainer();

  const isExpanded = isSelected;

  useEffect(() => {
    if (isKeyFocused) interactiveRef.current?.focus();
  }, [isKeyFocused]);

  useEffect(() => {
    if (!(isSelected || isKeyFocused)) return;
    const container = scrollContainerRef?.current;
    const el = scrollRef.current;
    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elOffsetInContainer = elRect.top - containerRect.top;
    const targetScrollTop =
      container.scrollTop + elOffsetInContainer - (containerRect.height - elRect.height) / 2;

    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }, [isSelected, isKeyFocused, scrollContainerRef]);

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

  const renderPages = () => (
    <Box mb="1">
      {PAGES.map(({ id, label, Icon, shortcut }) => {
        const to = `/projects/${projectId}/versions/${version.versionId}/${id}`;
        const isActive = location.pathname === to;
        return (
          <SidebarNavItem
            key={id}
            active={isActive}
            collapsed={collapsed}
            to={to}
            label={label}
            icon={<Icon size={collapsed ? 13 : 15} />}
            paddingLeft={collapsed ? undefined : 42}
            shortcut={shortcut}
          />
        );
      })}
    </Box>
  );

  if (collapsed) {
    return (
      <Box ref={scrollRef}>
        <Tooltip content={version.name} side="right" sideOffset={8}>
          <Flex
            ref={interactiveRef}
            role="button"
            tabIndex={0}
            align="center"
            justify="center"
            py="2"
            m="1"
            className="version-row version-row--collapsed"
            onClick={() =>
              navigate(`/projects/${projectId}/versions/${version.versionId}/overview`)
            }
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
              outline: isSelected || isKeyFocused ? '2px solid var(--green-7)' : 'none',
              outlineOffset: -2,
              backgroundColor: isSelected ? 'var(--green-3)' : undefined,
            }}
          >
            <GitBranch
              size={15}
              color={isSelected || isKeyFocused ? 'var(--green-9)' : 'var(--gray-8)'}
            />
          </Flex>
        </Tooltip>

        {isExpanded && renderPages()}
      </Box>
    );
  }

  return (
    <Box ref={scrollRef}>
      <Flex
        ref={interactiveRef}
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
          outline: isSelected || isKeyFocused ? '2px solid var(--green-7)' : 'none',
          outlineOffset: -2,
          backgroundColor: isSelected ? 'var(--green-3)' : undefined,
        }}
      >
        <GitBranch
          size={15}
          color={isSelected || isKeyFocused ? 'var(--green-9)' : 'var(--gray-8)'}
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

      {isExpanded && renderPages()}
    </Box>
  );
}
