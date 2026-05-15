import { css, cx } from '@linaria/core';
import { useCallback } from 'react';
import { useFileTabs } from '@/context/file-tabs';
import { FileViewer } from './file-viewer';
import { IconButton } from '@/components/ui/icon-button';

const panelOuterStyle = css`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-bg);
`;

const tabBarStyle = css`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 3px;
  }
`;

const tabStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);
  border-radius: 4px 4px 0 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }

  &[data-active='true'] {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: inset 0 -1.5px 0 var(--color-accent);
  }
`;

const tabCloseStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text);
  }
`;

const spacerStyle = css`
  flex: 1;
`;

function getShortName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

export type FilePanelProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function FilePanel({ className, style }: FilePanelProps) {
  const { tabs, activePath, closeFile, setActiveFile, closeAll } = useFileTabs();
  const showingFiles = tabs.length > 0;

  const handleTabClose = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      closeFile(path);
    },
    [closeFile],
  );

  const handleFileLinkClick = useCallback(
    (path: string) => {
      setActiveFile(path);
    },
    [setActiveFile],
  );

  if (!showingFiles) return null;

  return (
    <div className={cx(panelOuterStyle, className)} style={style}>
      <div className={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.path}
            className={tabStyle}
            data-active={activePath === tab.path}
            onClick={() => setActiveFile(tab.path)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
              {getShortName(tab.path)}
            </span>
            <span
              className={tabCloseStyle}
              onClick={(e) => handleTabClose(e, tab.path)}
              role="button"
              aria-label="Close"
            >
              ×
            </span>
          </button>
        ))}
        <div className={spacerStyle} />
        <IconButton size="sm" tooltip="关闭所有文件" onClick={closeAll}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {activePath ? (
          <FileViewer
            path={activePath}
            maxHeight={Number.MAX_SAFE_INTEGER}
            onFileLinkClick={handleFileLinkClick}
          />
        ) : null}
      </div>
    </div>
  );
}
