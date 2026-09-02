import { NavLink } from 'react-router';
import { Home } from 'lucide-react';
import { Kbd, Text } from '@radix-ui/themes';

interface ProjectNavItemProps {
  projectId: string;
  title: string;
  shortcut?: string;
}

/**
 * Links to the project overview page.
 * Active only when exactly on /projects/:id (not on any child version/page route).
 */
export function ProjectNavItem({ projectId, title, shortcut }: Readonly<ProjectNavItemProps>) {
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
