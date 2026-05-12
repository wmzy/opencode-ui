import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSdk } from '@/context/sdk';
import { useNotification } from '@/context/notification';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarSessionList } from './sidebar-session-list';
import { SidebarRail } from './sidebar-rail';
import type { Project } from '@/types/project';
import type { Session } from '@/types/session';
import type { OpenCodeSdk } from '@/lib/sdk';

const overlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;

  &.closed {
    opacity: 0;
    pointer-events: none;
  }
`;

const sheetStyle = css`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: min(340px, 90vw);
  z-index: 50;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: row;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: pan-y;

  &.closed {
    transform: translateX(-100%);
  }
`;

const sheetRailStyle = css`
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
`;

const sheetContentStyle = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const sheetHeader = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  flex-shrink: 0;
`;

const sheetTitle = css`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`;

const closeBtn = css`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  font-size: 18px;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const newSessionRow = css`
  padding: 0 12px 8px;
  flex-shrink: 0;
`;

const listSection = css`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const swipeHandle = css`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border-focus);
  margin: 8px auto 0;
`;

const actionsBarStyle = css`
  flex-shrink: 0;
  display: flex;
  gap: 2px;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
`;

const actionBtnStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;

    &:hover {
      background: transparent;
    }
  }
`;

const actionBtnDangerStyle = css`
  color: var(--color-error);

  &:hover {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    color: var(--color-error);
  }
`;

const editOverlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
`;

const editDialogStyle = css`
  width: min(320px, 85vw);
  padding: 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const editFieldStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;

  & label {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  & input {
    padding: 6px 10px;
    font-size: 13px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text);
    outline: none;
    font-family: inherit;

    &:focus {
      border-color: var(--color-accent);
    }
  }
`;

const editActionsStyle = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const editBtnStyle = css`
  padding: 6px 14px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: var(--color-border);
  }
`;

const editBtnPrimaryStyle = css`
  padding: 6px 14px;
  font-size: 13px;
  border-radius: 6px;
  border: none;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    opacity: 0.9;
  }
`;

function isSession(value: unknown): value is Session {
  return typeof value === 'object' && value !== null && 'id' in value && 'title' in value;
}

export type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  onSettings?: () => void;
  project?: Project | null;
  projects: Project[];
  currentPath: string;
  projectSdk: OpenCodeSdk;
};

export function MobileNav({ open, onClose, onSettings, project, projects, currentPath, projectSdk }: MobileNavProps) {
  const { client } = useSdk();
  const navigate = useNavigate();
  const notification = useNotification();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workspaceEnabled, setWorkspaceEnabled] = useState<Record<string, boolean>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    projectSdk.session.list({ roots: true, limit: 55 } as Parameters<typeof projectSdk.session.list>[0])
      .then((data) => {
        if (!mountedRef.current) return;
        setSessions((data as unknown[]).filter(isSession));
      })
      .catch(() => {
        if (mountedRef.current) setSessions([]);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
    return () => {
      mountedRef.current = false;
    };
  }, [projectSdk]);

  const handleNewSession = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const data = await projectSdk.session.create() as unknown;
      const session = isSession(data) ? data : undefined;
      if (session) {
        setSessions(prev => [session, ...prev]);
      }
    } finally {
      setCreating(false);
    }
  }, [projectSdk, creating]);

  const handleDeleteSession = useCallback(async (id: string) => {
    await projectSdk.session.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [projectSdk]);

  const handleRenameSession = useCallback(async (id: string, title: string) => {
    await projectSdk.session.update(id, { body: { title } });
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  }, [projectSdk]);

  const handleArchiveSession = useCallback(async (id: string) => {
    await projectSdk.session.update(id, { body: { time: { archived: Date.now() } } });
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [projectSdk]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null || !sheetRef.current) return;
    const delta = e.touches[0].clientX - touchStartRef.current;
    if (delta < 0) {
      sheetRef.current.style.transform = `translateX(${delta}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null || !sheetRef.current) return;
    const delta = e.changedTouches[0].clientX - touchStartRef.current;
    sheetRef.current.style.transform = '';
    if (delta < -60) {
      onClose();
    }
    touchStartRef.current = null;
  }, [onClose]);

  const handleSelect = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleEdit = useCallback(() => {
    if (!project) return;
    const name = project.name ?? project.worktree.replace(/\/+$/, '').split('/').pop() ?? '';
    setEditName(name);
    setEditOpen(true);
  }, [project]);

  const handleEditSave = useCallback(async () => {
    if (!project) return;
    try {
      await client.project.update(project.id, { body: { name: editName || undefined } });
    } catch {
      // edit failure
    }
    setEditOpen(false);
  }, [client, project, editName]);

  const handleToggleWorkspace = useCallback(() => {
    if (!project) return;
    setWorkspaceEnabled(prev => ({ ...prev, [project.worktree]: !prev[project.worktree] }));
  }, [project]);

  const handleCloseProject = useCallback(() => {
    if (!project) return;
    const remaining = projects.filter(p => p.worktree !== project.worktree);
    if (remaining.length > 0) {
      navigate(`/${btoa(remaining[0].worktree)}/session`);
    } else {
      navigate('/');
    }
    onClose();
  }, [project, projects, navigate, onClose]);

  const handleClearNotifications = useCallback(() => {
    if (!project) return;
    notification.project.markViewed(project.worktree);
  }, [project, notification.project]);

  const displayName = project
    ? (project.name ?? project.worktree.replace(/\/+$/, '').split('/').pop() ?? currentPath.replace(/\/+$/, '').split('/').pop() ?? '')
    : currentPath
      ? currentPath.replace(/\/+$/, '').split('/').pop() ?? ''
      : '';

  return (
    <>
      <div
        className={cx(overlayStyle, !open && 'closed')}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={cx(sheetStyle, !open && 'closed')}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={sheetRailStyle}>
          <SidebarRail onSettings={onSettings} />
        </div>
        <div className={sheetContentStyle}>
          <div className={swipeHandle} />

          <div className={sheetHeader}>
            <span className={sheetTitle}>{displayName}</span>
            <button className={closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <div className={newSessionRow}>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              loading={creating}
              onClick={handleNewSession}
            >
              + New Session
            </Button>
          </div>

          <div className={listSection}>
            <ScrollArea autoHideScrollbar>
              <SidebarSessionList
                sessions={sessions}
                loading={loading}
                onSelect={handleSelect}
                onDelete={handleDeleteSession}
                onRename={handleRenameSession}
                onArchive={handleArchiveSession}
              />
            </ScrollArea>
          </div>

          {project && (
            <div className={actionsBarStyle}>
              <button className={actionBtnStyle} onClick={handleEdit}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.5 1.5l3 3L5 14H2v-3z" />
                </svg>
                编辑
              </button>
              <button
                className={actionBtnStyle}
                onClick={handleToggleWorkspace}
                disabled={project.vcs !== 'git' && !workspaceEnabled[project.worktree]}
              >
                {workspaceEnabled[project.worktree] ? '禁用工作区' : '启用工作区'}
              </button>
              <button
                className={actionBtnStyle}
                onClick={handleClearNotifications}
                disabled={!project || notification.project.unseenCount(project.worktree) === 0}
              >
                清除通知
              </button>
              <button className={cx(actionBtnStyle, actionBtnDangerStyle)} onClick={handleCloseProject}>
                关闭
              </button>
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <div className={editOverlayStyle} onClick={() => setEditOpen(false)}>
          <div className={editDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
              编辑项目
            </div>
            <div className={editFieldStyle}>
              <label>名称</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') setEditOpen(false);
                }}
                autoFocus
              />
            </div>
            <div className={editActionsStyle}>
              <button className={editBtnStyle} onClick={() => setEditOpen(false)}>
                取消
              </button>
              <button className={editBtnPrimaryStyle} onClick={handleEditSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
