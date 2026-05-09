import { css } from '@linaria/core';
import { useState } from 'react';
import { Dialog } from './dialog';
import { Button } from '@/components/ui/button';

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 420px;
  overflow-y: auto;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &[data-selected='true'] {
    background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  }
`;

const dirNameStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const dirPathStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-family: var(--haze-font-mono, monospace);
`;

const emptyStyle = css`
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-tertiary);
  font-size: 14px;
`;

type DirEntry = {
  name: string;
  path: string;
};

const RECENT_DIRS: DirEntry[] = [
  { name: 'opencode-ui', path: '/home/user/projects/opencode-ui' },
  { name: 'my-app', path: '/home/user/projects/my-app' },
  { name: 'backend', path: '/home/user/projects/backend' },
];

export type SelectDirectoryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect?: (path: string) => void;
  currentPath?: string;
};

export function SelectDirectoryDialog({ open, onClose, onSelect, currentPath }: SelectDirectoryDialogProps) {
  const [selected, setSelected] = useState<string | null>(currentPath ?? null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Select Directory"
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onSelect?.(selected);
                onClose();
              }
            }}
          >
            Open
          </Button>
        </div>
      )}
    >
      {RECENT_DIRS.length === 0 ? (
        <div className={emptyStyle}>No recent directories</div>
      ) : (
        <div className={listStyle}>
          {RECENT_DIRS.map(dir => (
            <div
              key={dir.path}
              className={itemStyle}
              data-selected={selected === dir.path}
              onClick={() => setSelected(dir.path)}
            >
              <div>
                <div className={dirNameStyle}>{dir.name}</div>
                <div className={dirPathStyle}>{dir.path}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
