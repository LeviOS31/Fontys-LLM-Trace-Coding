import { NavLink } from 'react-router';
import { Home } from 'lucide-react';
import { Kbd, Text, Tooltip, Box } from '@radix-ui/themes';

interface ProjectNavItemProps {
  collapsed?: boolean;
  projectId: string;
  title: string;
  shortcut?: string;
}

/**
 * Links to the project overview page.
 * Active on /projects/:id and any nested version/page route (no `end`).
 */
export function ProjectNavItem({
  collapsed = false,
  projectId,
  title,
  shortcut,
}: Readonly<ProjectNavItemProps>) {
  if (collapsed) {
    return (
      <Tooltip content={title} side="right" sideOffset={8}>
        <NavLink
          to={`/projects/${projectId}`}
          className={({ isActive }) =>
            `project-nav-item project-nav-item--collapsed${isActive ? ' project-nav-item--active' : ''}`
          }
        >
          <Box style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Home size={22} style={{ flexShrink: 0 }} />
          </Box>
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={`/projects/${projectId}`}
      end
      className={({ isActive }) => `project-nav-item${isActive ? ' project-nav-item--active' : ''}`}
    >
      <Home size={15} style={{ flexShrink: 0 }} />
      <Text as="span" size="2" weight="medium" truncate style={{ flex: 1, color: 'inherit' }}>
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
