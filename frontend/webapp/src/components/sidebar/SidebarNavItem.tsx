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
  active: boolean;
}

export function SidebarNavItem({
  to,
  label,
  icon,
  paddingLeft = 12,
  shortcut,
  collapsed = false,
  active,
}: Readonly<SidebarNavItemProps>) {
  const renderedIcon =
    icon && isValidElement(icon)
      ? cloneElement(icon as ReactElement<{ color?: string }>, {
          color: active ? 'var(--green-9)' : 'var(--gray-8)',
        })
      : icon;

  const activeStyle = {
    outline: active ? '2px solid var(--green-7)' : 'none',
    outlineOffset: -2,
    backgroundColor: active ? 'var(--green-3)' : undefined,
  };

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" sideOffset={8}>
        <NavLink
          to={to}
          end
          className="sidebar-nav-item sidebar-nav-item--collapsed"
          style={activeStyle}
        >
          <Box style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {renderedIcon}
          </Box>
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <NavLink to={to} end className="sidebar-nav-item" style={{ paddingLeft, ...activeStyle }}>
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{renderedIcon}</span>
      <Text
        as="span"
        size="2"
        truncate
        style={{ flex: 1, color: active ? 'var(--green-11)' : 'inherit' }}
      >
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
