import { css, cx } from '@linaria/core';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSdk } from '@/context/sdk';
import { useLayout } from '@/context/layout';
import { useNotification } from '@/context/notification';
import { useI18n } from '@/context/language';
import { Tooltip } from '@/components/ui/tooltip';
import type { Project } from '@/types/project';

const railStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--sidebar-rail-width, 56px);
  height: 100%;
  padding: 8px 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
  user-select: none;
`;

const railItems = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const projectButton = css`
  position: relative;
  width: 36px;
  height: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  border: 2px solid transparent;
  background: transparent;
  flex-shrink: 0;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  &.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--color-accent) 15%, transparent);
      color: var(--color-accent);
    }
  }
`;

const projectAvatar = css`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`;

const activeIndicator = css`
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
`;

const notifyDot = css`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  z-index: 1;
`;

const bottomSection = css`
  flex-shrink: 0;
  width: 100%;
  padding: 4px 0 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border-top: 1px solid var(--color-border);
`;

const iconButton = css`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 18px;
  transition: background 0.15s, color 0.15s;
  background: none;
  border: none;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const contextMenuStyle = css`
  position: fixed;
  z-index: 1200;
  min-width: 160px;
  padding: 4px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
`;

const contextMenuItemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.1s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;

    &:hover {
      background: transparent;
    }
  }
`;

const contextMenuDangerStyle = css`
  color: var(--color-error);

  &:hover {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
  }
`;

const contextMenuSeparator = css`
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
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
  width: min(360px, 90vw);
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

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const projectSearchListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
`;

const projectSearchItemStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const projectSearchAvatar = css`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`;

const projectSearchInfo = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const projectSearchName = css`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const projectSearchPath = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const noResultsStyle = css`
  padding: 12px;
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-align: center;
`;

const avatarColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
];

function getProjectColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getProjectDisplayName(project: Project): string {
  if (project.name) return project.name;
  const segments = project.worktree.replace(/\/+$/, '').split('/');
  return segments[segments.length - 1] || project.id;
}

type ContextMenuState = {
  project: Project;
  x: number;
  y: number;
};

export type SidebarRailProps = {
  onSettings?: () => void;
};

export function SidebarRail({ onSettings }: SidebarRailProps) {
  const { t } = useI18n();
  const { client, getSdk } = useSdk();
  const { layout, toggleSidebar } = useLayout();
  const notification = useNotification();
  const navigate = useNavigate();
  const { dir } = useParams<{ dir: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [workspaceEnabled, setWorkspaceEnabled] = useState<Record<string, boolean>>({});
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addProjectPath, setAddProjectPath] = useState('');
  const [addProjectSearch, setAddProjectSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    client.project.list()
      .then((data) => {
        if (cancelled) return;
        const raw = data as Project[];
        let closed: string[] = [];
        try {
          closed = JSON.parse(localStorage.getItem('opencode-closed-projects') ?? '[]');
        } catch {
          // ignore
        }
        setProjects(raw.filter(p => !closed.includes(p.worktree)));
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const currentPath = useMemo(() => {
    try {
      return dir ? atob(dir) : '';
    } catch {
      return dir ?? '';
    }
  }, [dir]);

  const activeProjectId = useMemo(() => {
    const match = projects.find(p => p.worktree === currentPath);
    return match?.id ?? null;
  }, [projects, currentPath]);

  const handleProjectClick = useCallback(async (project: Project) => {
    const isActive = project.id === activeProjectId;
    if (isActive) {
      toggleSidebar();
    } else {
      const encoded = btoa(project.worktree);
      const sdk = getSdk(project.worktree);
      try {
        const sessions = (await sdk.session.list({ roots: true, limit: 1 })) as Array<{ id: string }>;
        const firstId = sessions[0]?.id;
        navigate(firstId ? `/${encoded}/session/${firstId}` : `/${encoded}/session`);
      } catch {
        navigate(`/${encoded}/session`);
      }
      if (!layout.sidebarOpen) {
        toggleSidebar();
      }
    }
  }, [activeProjectId, toggleSidebar, getSdk, navigate, layout.sidebarOpen]);

  const handleContextMenu = useCallback((e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenu({ project, x, y });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    const closeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeKey);
    };
  }, [contextMenu]);

  const handleEdit = useCallback(() => {
    if (!contextMenu) return;
    setEditName(contextMenu.project.name ?? getProjectDisplayName(contextMenu.project));
    setEditingProject(contextMenu.project);
    setContextMenu(null);
  }, [contextMenu]);

  const handleEditSave = useCallback(async () => {
    if (!editingProject) return;
    try {
      await client.project.update(editingProject.id, { body: { name: editName || undefined } });
      setProjects(prev => prev.map(p =>
        p.id === editingProject.id ? { ...p, name: editName || undefined } : p,
      ));
    } catch {
      // edit failure
    }
    setEditingProject(null);
  }, [client, editingProject, editName]);

  const handleToggleWorkspace = useCallback(() => {
    if (!contextMenu) return;
    const worktree = contextMenu.project.worktree;
    setWorkspaceEnabled(prev => ({ ...prev, [worktree]: !prev[worktree] }));
    setContextMenu(null);
  }, [contextMenu]);

  const handleClearNotifications = useCallback(() => {
    if (!contextMenu) return;
    notification.project.markViewed(contextMenu.project.worktree);
    setContextMenu(null);
  }, [contextMenu, notification.project]);

  const addProjectFiltered = useMemo(() => {
    if (!addProjectSearch.trim()) return projects;
    const q = addProjectSearch.toLowerCase();
    return projects.filter(p => {
      const name = getProjectDisplayName(p).toLowerCase();
      const path = p.worktree.toLowerCase();
      return name.includes(q) || path.includes(q);
    });
  }, [projects, addProjectSearch]);

  const handleAddProject = useCallback(() => {
    const path = addProjectPath.trim();
    if (!path) return;
    const encoded = btoa(path);
    const sdk = getSdk(path);
    setAddProjectOpen(false);
    setAddProjectPath('');
    sdk.session.list({ roots: true, limit: 1 })
      .then((sessions) => {
        const firstId = (sessions as Array<{ id: string }>)[0]?.id;
        navigate(firstId ? `/${encoded}/session/${firstId}` : `/${encoded}/session`);
      })
      .catch(() => {
        navigate(`/${encoded}/session`);
      });
  }, [addProjectPath, getSdk, navigate]);

  const handleCloseProject = useCallback(() => {
    if (!contextMenu) return;
    const closedWorktree = contextMenu.project.worktree;
    const encoded = btoa(closedWorktree);
    const isCurrent = currentPath === closedWorktree;
    setContextMenu(null);
    setProjects(prev => prev.filter(p => p.worktree !== closedWorktree));
    try {
      const closed: string[] = JSON.parse(localStorage.getItem('opencode-closed-projects') ?? '[]');
      if (!closed.includes(closedWorktree)) {
        closed.push(closedWorktree);
        localStorage.setItem('opencode-closed-projects', JSON.stringify(closed));
      }
    } catch {
      // ignore
    }
    if (isCurrent) {
      const remaining = projects.filter(p => p.worktree !== closedWorktree);
      if (remaining.length > 0) {
        const next = remaining[0];
        const nextEncoded = btoa(next.worktree);
        navigate(`/${nextEncoded}/session`);
      } else {
        navigate('/');
      }
    }
    if (window.location.pathname.includes(encoded)) {
      const remaining = projects.filter(p => p.worktree !== closedWorktree);
      if (remaining.length > 0) {
        navigate(`/${btoa(remaining[0].worktree)}/session`);
      } else {
        navigate('/');
      }
    }
  }, [contextMenu, currentPath, projects, navigate]);

  return (
    <>
      <div className={railStyle}>
        <div className={railItems}>
          <Tooltip content={t('sidebar.add_project')} position="right">
            <button
              className={iconButton}
              onClick={() => setAddProjectOpen(true)}
              aria-label={t('sidebar.add_project')}
            >
              +
            </button>
          </Tooltip>
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const displayName = getProjectDisplayName(project);
            const letter = (project.icon?.override ?? displayName.charAt(0)?.toUpperCase() ?? '?');
            const bgColor = project.icon?.color ?? getProjectColor(displayName);
            const unseen = notification.project.unseenCount(project.worktree);
            const hasError = notification.project.unseenHasError(project.worktree);

            return (
              <Tooltip content={displayName} position="right" key={project.id}>
                <button
                  className={cx(projectButton, isActive && 'active')}
                  onClick={() => handleProjectClick(project)}
                  onContextMenu={(e) => handleContextMenu(e, project)}
                  aria-label={displayName}
                >
                  {isActive && <span className={activeIndicator} />}
                  <span className={projectAvatar} style={{ background: bgColor }}>
                    {letter}
                  </span>
                  {unseen > 0 && (
                    <span
                      className={notifyDot}
                      style={{ background: hasError ? 'var(--color-error)' : 'var(--color-accent)' }}
                    />
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className={bottomSection}>
          {onSettings && (
            <Tooltip content={t('settings.title')} position="right">
              <button
                className={iconButton}
                onClick={onSettings}
                aria-label={t('settings.title')}
              >
                ⚙
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className={contextMenuStyle}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className={contextMenuItemStyle} onClick={handleEdit}>
            {t('project.edit')}
          </button>
          <button
            className={contextMenuItemStyle}
            onClick={handleToggleWorkspace}
            disabled={contextMenu.project.vcs !== 'git' && !workspaceEnabled[contextMenu.project.worktree]}
          >
            {workspaceEnabled[contextMenu.project.worktree] ? t('workspace.disable') : t('workspace.enable')}
          </button>
          <button
            className={contextMenuItemStyle}
            onClick={handleClearNotifications}
            disabled={!contextMenu || notification.project.unseenCount(contextMenu.project.worktree) === 0}
          >
            {t('notification.clear')}
          </button>
          <div className={contextMenuSeparator} />
          <button className={cx(contextMenuItemStyle, contextMenuDangerStyle)} onClick={handleCloseProject}>
            {t('project.close')}
          </button>
        </div>
      )}

      {editingProject && (
        <div className={editOverlayStyle} onClick={() => setEditingProject(null)}>
          <div className={editDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
              {t('project.edit')}
            </div>
            <div className={editFieldStyle}>
              <label>{t('project.name')}</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') setEditingProject(null);
                }}
                autoFocus
              />
            </div>
            <div className={editActionsStyle}>
              <button className={editBtnStyle} onClick={() => setEditingProject(null)}>
                {t('common.cancel')}
              </button>
              <button className={editBtnPrimaryStyle} onClick={handleEditSave}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {addProjectOpen && (
        <div
          className={editOverlayStyle}
          onClick={() => {
            setAddProjectOpen(false);
            setAddProjectPath('');
            setAddProjectSearch('');
          }}
        >
          <div className={editDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
              {t('project.open')}
            </div>
            <div className={editFieldStyle}>
              <input
                value={addProjectSearch}
                onChange={(e) => setAddProjectSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setAddProjectOpen(false);
                    setAddProjectPath('');
                    setAddProjectSearch('');
                  }
                }}
                placeholder={t('sidebar.search_projects')}
                autoFocus
              />
            </div>
            <div className={projectSearchListStyle}>
              {addProjectFiltered
                .map(project => (
                  <button
                    key={project.id}
                    className={projectSearchItemStyle}
                    onClick={() => {
                      setAddProjectOpen(false);
                      setAddProjectSearch('');
                      handleProjectClick(project);
                    }}
                  >
                    <span className={projectSearchAvatar} style={{ background: project.icon?.color ?? getProjectColor(getProjectDisplayName(project)) }}>
                      {project.icon?.override ?? getProjectDisplayName(project).charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                    <div className={projectSearchInfo}>
                      <span className={projectSearchName}>{getProjectDisplayName(project)}</span>
                      <span className={projectSearchPath}>{project.worktree.replace(/^\/home\/[^/]+/, '~')}</span>
                    </div>
                  </button>
                ))}
              {addProjectFiltered.length === 0 && (
                <div className={noResultsStyle}>{t('sidebar.no_results')}</div>
              )}
            </div>
            <div className={editFieldStyle}>
              <label>{t('sidebar.custom_path')}</label>
              <input
                value={addProjectPath}
                onChange={(e) => setAddProjectPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProject();
                  if (e.key === 'Escape') {
                    setAddProjectOpen(false);
                    setAddProjectPath('');
                    setAddProjectSearch('');
                  }
                }}
                placeholder="/path/to/project"
              />
            </div>
            <div className={editActionsStyle}>
              <button
                className={editBtnStyle}
                onClick={() => {
                  setAddProjectOpen(false);
                  setAddProjectPath('');
                  setAddProjectSearch('');
                }}
              >
                {t('common.cancel')}
              </button>
              <button className={editBtnPrimaryStyle} onClick={handleAddProject} disabled={!addProjectPath.trim()}>
                {t('project.open_action')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
