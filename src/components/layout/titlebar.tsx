import { css } from '@linaria/core';
import type { ReactNode } from 'react';
import { useI18n } from '@/context/language';

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: var(--titlebar-height);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 8px;
  -webkit-app-region: drag;
`;

const titleStyle = css`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const actionsStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
`;

const actionButton = css`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

export type TitlebarProps = {
  title?: string;
  actions?: ReactNode;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
};

export function Titlebar({ title, actions, onToggleSidebar, showSidebarToggle }: TitlebarProps) {
  const { t } = useI18n();
  return (
    <div className={headerStyle}>
      {showSidebarToggle && (
        <button className={actionButton} onClick={onToggleSidebar} title={t('sidebar.toggle')}>
          ☰
        </button>
      )}
      <span className={titleStyle}>{title ?? t('app.name')}</span>
      {actions && <div className={actionsStyle}>{actions}</div>}
    </div>
  );
}
