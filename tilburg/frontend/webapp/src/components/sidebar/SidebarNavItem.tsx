import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Kbd, Text } from '@radix-ui/themes';

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon?: ReactNode;
  paddingLeft?: number;
  /** Keyboard shortcut displayed as a muted Kbd hint on the right */
  shortcut?: string;
}

export function SidebarNavItem({
  to,
  label,
  icon,
  paddingLeft = 12,
  shortcut,
}: Readonly<SidebarNavItemProps>) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
      style={{ paddingLeft }}
    >
      {icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <Text as="span" size="2" truncate style={{ flex: 1, color: 'inherit' }}>
        {label}
      </Text>
      {shortcut && (
        <Kbd size="1" className="sidebar-nav-item__shortcut">
          {shortcut}
        </Kbd>
      )}
    </NavLink>
  );
}
