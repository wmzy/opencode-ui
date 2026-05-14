import { css, cx } from '@linaria/core';
import { useCallback, useState } from 'react';
import { useFileTree } from '@/context/file';
import { useFileTabs } from '@/context/file-tabs';
import { FileTree } from '@/components/file/file-tree';
import { SessionContextTab } from '@/components/session/session-context-tab';
import { SessionReviewTab } from '@/components/session/session-review-tab';
import type { FileNode, FileChange } from '@/types/file';
import type { Message } from '@/types/message';
import type { Part } from '@/types/part';
import type { Session } from '@/types/session';
import { useI18n } from '@/context/language';

const panelStyle = css`
  display: flex;
  flex-direction: column;
  width: 320px;
  min-width: 280px;
  max-width: 640px;
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    z-index: 50;
    border-left: none;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  }
`;

const panelHeaderStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
`;

const tabListStyle = css`
  display: flex;
  gap: 2px;
  flex: 1;
`;

const tabButtonStyle = css`
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  &[data-active='true'] {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const closeButtonStyle = css`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const panelContentStyle = css`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const changesListStyle = css`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
`;

const changeItemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
  transition: background 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const changePathStyle = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
`;

const statusBadgeBaseStyle = css`
  font-size: 10px;
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
`;

const emptyStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  text-align: center;
`;

const overlayStyle = css`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 49;
  }
`;

type SidePanelTab = 'files' | 'changes' | 'context' | 'review';

export type SessionSidePanelProps = {
  onClose: () => void;
  className?: string;
  messages?: Message[];
  partsByMessage?: Map<string, Part[]>;
  session?: Session;
  sessionID?: string;
  directory?: string;
};

export function SessionSidePanel({ onClose, className, messages, partsByMessage, session, sessionID, directory }: SessionSidePanelProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SidePanelTab>('files');
  const { gitStatus } = useFileTree();
  const { openFile } = useFileTabs();

  const handleFileClick = useCallback((node: FileNode) => {
    if (node.type === 'file') {
      openFile(node.path);
    }
  }, [openFile]);

  const handleChangeClick = useCallback((change: FileChange) => {
    openFile(change.path);
  }, [openFile]);

  return (
    <>
      <div className={overlayStyle} onClick={onClose} />
      <div className={cx(panelStyle, className)}>
        <div className={panelHeaderStyle}>
          <div className={tabListStyle} role="tablist">
            <button
              role="tab"
              className={tabButtonStyle}
              data-active={activeTab === 'files'}
              onClick={() => setActiveTab('files')}
            >
              {t('session.files')}
            </button>
            <button
              role="tab"
              className={tabButtonStyle}
              data-active={activeTab === 'changes'}
              onClick={() => setActiveTab('changes')}
            >
              {t('session.changes')}
            </button>
            <button
              role="tab"
              className={tabButtonStyle}
              data-active={activeTab === 'context'}
              onClick={() => setActiveTab('context')}
            >
              {t('session.context')}
            </button>
            {sessionID && (
              <button
                role="tab"
                className={tabButtonStyle}
                data-active={activeTab === 'review'}
                onClick={() => setActiveTab('review')}
              >
                {t('session.review')}
              </button>
            )}
          </div>
          <button className={closeButtonStyle} onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>
        <div className={panelContentStyle}>
          {activeTab === 'files' ? (
            <FileTree onFileClick={handleFileClick} />
          ) : activeTab === 'context' ? (
            <SessionContextTab
              messages={messages ?? []}
              partsByMessage={partsByMessage ?? new Map()}
              session={session}
            />
          ) : activeTab === 'review' && sessionID ? (
            <SessionReviewTab sessionID={sessionID} directory={directory} />
          ) : (
            <ChangesList changes={gitStatus} onFileClick={handleChangeClick} />
          )}
        </div>
      </div>
    </>
  );
}

type ChangesListProps = {
  changes: FileChange[];
  onFileClick: (change: FileChange) => void;
};

function ChangesList({ changes, onFileClick }: ChangesListProps) {
  const { t } = useI18n();
  if (changes.length === 0) {
    return <div className={emptyStyle}>{t('session.no_changes')}</div>;
  }

  const statusColors: Record<string, string> = {
    added: 'var(--color-success)',
    modified: 'var(--color-warning)',
    deleted: 'var(--color-error)',
  };

  const statusLetters: Record<string, string> = {
    added: 'A',
    modified: 'M',
    deleted: 'D',
  };

  return (
    <div className={changesListStyle}>
      {changes.map((change) => (
        <div
          key={change.path}
          className={changeItemStyle}
          onClick={() => onFileClick(change)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onFileClick(change);
            }
          }}
        >
          <span
            className={statusBadgeBaseStyle}
            style={{ color: statusColors[change.status] ?? 'var(--color-text-tertiary)' }}
          >
            {statusLetters[change.status] ?? '?'}
          </span>
          <span className={changePathStyle}>{change.path}</span>
          {change.added > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-success)', flexShrink: 0 }}>
              +{change.added}
            </span>
          )}
          {change.removed > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-error)', flexShrink: 0 }}>
              -{change.removed}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
