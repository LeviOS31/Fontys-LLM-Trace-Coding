import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { Activity, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProjectsNav } from './sidebar/ProjectsNav.tsx';
import './sidebar/sidebar.css';
import { LlmStatusIndicator } from '../feature/settings/components/LlmStatusIndicator.tsx';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 60;

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

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box
      style={{
        width,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
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

        {/* Navigation */}
        <Box style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', width: '100%' }}>
          <ProjectsNav collapsed={collapsed} />
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
