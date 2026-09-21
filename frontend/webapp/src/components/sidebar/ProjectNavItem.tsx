import { NavLink } from 'react-router';
import { Home } from 'lucide-react';
import { Kbd, Text, Tooltip, Box } from '@radix-ui/themes';

interface ProjectNavItemProps {
  collapsed?: boolean;
  projectId: string;
  title: string;
  shortcut?: string;
  active: boolean;
}

export function ProjectNavItem({
  collapsed = false,
  projectId,
  title,
  shortcut,
  active,
}: Readonly<ProjectNavItemProps>) {
  const style = {
    outline: active ? '2px solid var(--green-7)' : 'none',
    outlineOffset: -2,
    backgroundColor: active ? 'var(--green-3)' : undefined,
  };

  if (collapsed) {
    return (
      <Tooltip content={title} side="right" sideOffset={8}>
        <NavLink
          to={`/projects/${projectId}`}
          className="project-nav-item project-nav-item--collapsed"
          style={style}
        >
          <Box style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Home size={20} color="var(--green-9)" style={{ flexShrink: 0 }} />
          </Box>
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <NavLink to={`/projects/${projectId}`} className="project-nav-item" style={style}>
      <Home size={15} color="var(--green-9)" style={{ flexShrink: 0 }} />
      <Text
        as="span"
        size="2"
        weight="medium"
        truncate
        style={{ flex: 1, color: 'var(--green-11)' }}
      >
        {title}
      </Text>
      {shortcut && (
        <Kbd size="1" className="sidebar-nav-item__shortcut">
          {shortcut}
        </Kbd>
      )}
    </NavLink>
  );
}
