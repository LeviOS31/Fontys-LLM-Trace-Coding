import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Kbd, Text, Tooltip, Box } from '@radix-ui/themes';

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon?: ReactNode;
  paddingLeft?: number;
  shortcut?: string;
  collapsed?: boolean;
}

export function SidebarNavItem({
  to,
  label,
  icon,
  paddingLeft = 12,
  shortcut,
  collapsed = false,
}: Readonly<SidebarNavItemProps>) {
  const renderIcon = (isActive: boolean) => {
    if (!icon || !isValidElement(icon)) return icon;
    return cloneElement(icon as ReactElement<{ color?: string }>, {
      color: isActive ? 'var(--green-9)' : 'var(--green-8)',
    });
  };

  const activeInlineStyle = (isActive: boolean) =>
    isActive ? { backgroundColor: 'var(--green-3)', borderColor: 'var(--green-7)' } : {};

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" sideOffset={8}>
        <NavLink
          to={to}
          end
          className="sidebar-nav-item sidebar-nav-item--collapsed"
          style={({ isActive }) => activeInlineStyle(isActive)}
        >
          {({ isActive }) => (
            <Box style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              {renderIcon(isActive)}
            </Box>
          )}
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className="sidebar-nav-item"
      style={({ isActive }) => ({ paddingLeft, ...activeInlineStyle(isActive) })}
    >
      {({ isActive }) => (
        <>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {renderIcon(isActive)}
          </span>
          <Text as="span" size="2" truncate style={{ flex: 1, color: 'inherit' }}>
            {label}
          </Text>
          {shortcut && (
            <Kbd size="1" className="sidebar-nav-item__shortcut">
              {shortcut}
            </Kbd>
          )}
        </>
      )}
    </NavLink>
  );
}
