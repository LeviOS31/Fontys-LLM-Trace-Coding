import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { Activity, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProjectsNavHeader, ProjectsNavVersions } from './sidebar/ProjectsNav.tsx';
import './sidebar/sidebar.css';
import { LlmStatusIndicator } from '../feature/settings/components/LlmStatusIndicator.tsx';
import { SidebarScrollContext } from './sidebar/SidebarScrollContent.ts';
import { ScrollbarThumb } from './sidebar/ScrollbarThumb.tsx';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 60;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box
      style={{
        width,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        paddingBottom: 0,
        borderRight: `1px solid var(--gray-3)`,
        backgroundColor: 'var(--accent-1)',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      <Flex
        direction="column"
        align={collapsed ? 'center' : 'stretch'}
        style={{ height: '100%', width }}
      >
        {collapsed ? (
          <Flex
            direction="column"
            align="center"
            gap="2"
            style={{
              paddingTop: 20,
              paddingBottom: 18,
              borderBottom: `1px solid var(--gray-3)`,
              marginBottom: 12,
              flexShrink: 0,
              width: '100%',
            }}
          >
            <Activity size={22} strokeWidth={2} color="var(--accent-9)" />
            <IconButton
              variant="ghost"
              color="gray"
              size="1"
              onClick={() => setCollapsed(false)}
              aria-label="Open sidebar"
            >
              <PanelLeftOpen size={16} />
            </IconButton>
          </Flex>
        ) : (
          <Flex
            align="center"
            gap="3"
            px="4"
            style={{
              paddingTop: 20,
              paddingBottom: 18,
              borderBottom: `1px solid var(--gray-3)`,
              marginBottom: 12,
              flexShrink: 0,
            }}
          >
            <Activity size={22} strokeWidth={2} color="var(--accent-9)" />
            <Box style={{ flex: 1 }}>
              <Text as="div" size="4" weight="bold">
                TraceEval
              </Text>
              <Text as="div" size="1" color="gray">
                LLM Analysis
              </Text>
            </Box>
            <IconButton
              variant="ghost"
              color="gray"
              size="1"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </IconButton>
          </Flex>
        )}

        {/* Pinned: project selector + home link — does not scroll */}
        <Box
          style={{
            flexShrink: 0,
            width: '100%',
            marginBottom: 3,
            borderBottom: `1px solid var(--gray-3)`,
          }}
        >
          <ProjectsNavHeader collapsed={collapsed} />
        </Box>

        {/* Scrollable: version list only */}
        <Box style={{ flexGrow: 1, minHeight: 0, width: '100%', position: 'relative' }}>
          <SidebarScrollContext.Provider value={scrollContainerRef}>
            <Box
              ref={scrollContainerRef}
              className="sidebar-nav-scroll"
              style={{
                height: '100%',
                width: '100%',
              }}
            >
              <ProjectsNavVersions collapsed={collapsed} />
              <Box style={{ height: '10vh' }} aria-hidden />
            </Box>
          </SidebarScrollContext.Provider>
          <ScrollbarThumb containerRef={scrollContainerRef} />
        </Box>

        <Box
          px={collapsed ? '0' : '3'}
          py="2"
          style={{
            borderTop: `1px solid var(--gray-3)`,
            flexShrink: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <LlmStatusIndicator collapsed={collapsed} />
        </Box>
      </Flex>
    </Box>
  );
}
