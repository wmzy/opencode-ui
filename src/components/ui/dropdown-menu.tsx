import { css, cx } from '@linaria/core';
import { Menu, MenuItem as HazeMenuItem, MenuDivider as HazeMenuDivider } from 'haze-ui';
import type { ReactNode } from 'react';

const triggerStyle = css`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;

const menuItemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.1s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const menuItemIconStyle = css`
  display: flex;
  align-items: center;
  color: var(--color-text-tertiary);
  font-size: 14px;
  flex-shrink: 0;
`;

const menuItemLabelStyle = css`
  flex: 1;
  min-width: 0;
`;

const menuItemShortcutStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-left: 16px;
`;

const dangerItemStyle = css`
  color: var(--color-error);

  &:hover {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
  }
`;

const menuContentStyle = css`
  min-width: 160px;
  padding: 4px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1100;
`;

export type DropdownMenuProps = {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
};

export function DropdownMenu({
  trigger,
  open,
  onOpenChange,
  className,
  children,
}: DropdownMenuProps) {
  const handleClose = () => onOpenChange?.(false);

  return (
    <Menu open={open ?? false} trigger={<span className={triggerStyle}>{trigger}</span>}>
      <div className={cx(menuContentStyle, className)} onClick={handleClose}>
        {children}
      </div>
    </Menu>
  );
}

export type DropdownMenuItemProps = {
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function DropdownMenuItem({
  icon,
  shortcut,
  danger = false,
  children,
  className,
  onClick,
}: DropdownMenuItemProps) {
  return (
    <div
      className={cx(menuItemStyle, danger ? dangerItemStyle : undefined, className)}
      onClick={onClick}
      role="menuitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {icon && <span className={menuItemIconStyle}>{icon}</span>}
      <span className={menuItemLabelStyle}>{children}</span>
      {shortcut && <span className={menuItemShortcutStyle}>{shortcut}</span>}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        css`
          height: 1px;
          background: var(--color-border);
          margin: 4px 0;
        `,
        className,
      )}
      role="separator"
    />
  );
}
