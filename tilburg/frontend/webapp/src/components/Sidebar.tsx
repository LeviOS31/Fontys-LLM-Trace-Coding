import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { Activity, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProjectsNav } from './sidebar/ProjectsNav.tsx';
import './sidebar/sidebar.css';
import { LlmStatusIndicator } from '../feature/settings/components/LlmStatusIndicator.tsx';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <>
      <Box
        style={{
          width: collapsed ? 0 : 280,
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          borderRight: collapsed ? 'none' : `1px solid var(--gray-3)`,
          backgroundColor: 'var(--accent-1)',
          overflow: 'hidden',
          transition: 'width 0.2s ease, border 0.2s ease',
        }}
      >
        <Flex direction="column" style={{ height: '100%', width: 280 }}>
          {/* App title */}
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

          {/* Navigation */}
          <Box style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
            <ProjectsNav />
          </Box>

          <Box
            px="3"
            py="2"
            style={{
              borderTop: `1px solid var(--gray-3)`,
              flexShrink: 0,
            }}
          >
            <LlmStatusIndicator />
          </Box>
        </Flex>
      </Box>

      {collapsed && (
        <Box
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 100,
          }}
        >
          <IconButton
            variant="soft"
            color="gray"
            size="2"
            onClick={() => setCollapsed(false)}
            aria-label="Open sidebar"
          >
            <PanelLeftOpen size={16} />
          </IconButton>
        </Box>
      )}
    </>
  );
}
