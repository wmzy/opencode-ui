import { css, cx } from '@linaria/core';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSdk } from '@/context/sdk';
import { useServer } from '@/context/server';
import { useSync } from '@/context/sync';
import { useLayout } from '@/context/layout';
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

const statusDot = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 6px 0;

  &.connected { background: var(--color-success); }
  &.disconnected { background: var(--color-error); }
  &.connecting {
    background: var(--color-warning);
    animation: rail-pulse 1.5s ease-in-out infinite;
  }

  @keyframes rail-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
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

export type SidebarRailProps = {
  onSettings?: () => void;
};

export function SidebarRail({ onSettings }: SidebarRailProps) {
  const { client } = useSdk();
  const { status } = useServer();
  const { connected } = useSync();
  const { layout, toggleSidebar } = useLayout();
  const navigate = useNavigate();
  const { dir } = useParams<{ dir: string }>();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    client.project.list()
      .then((data) => {
        if (!cancelled) setProjects(data as Project[]);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => { cancelled = true; };
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

  const handleProjectClick = (project: Project) => {
    const isActive = project.id === activeProjectId;
    if (isActive) {
      toggleSidebar();
    } else {
      const encoded = btoa(project.worktree);
      navigate(`/${encoded}/session`);
      if (!layout.sidebarOpen) toggleSidebar();
    }
  };

  return (
    <div className={railStyle}>
      <div className={railItems}>
        <div className={cx(statusDot, connected ? 'connected' : status)} />

        {projects.map((project) => {
          const isActive = project.id === activeProjectId;
          const displayName = getProjectDisplayName(project);
          const letter = (project.icon?.override ?? displayName.charAt(0)?.toUpperCase() ?? '?');
          const bgColor = project.icon?.color ?? getProjectColor(displayName);

          return (
            <Tooltip content={displayName} position="right" key={project.id}>
              <button
                className={cx(projectButton, isActive && 'active')}
                onClick={() => handleProjectClick(project)}
                aria-label={displayName}
              >
                {isActive && <span className={activeIndicator} />}
                <span className={projectAvatar} style={{ background: bgColor }}>
                  {letter}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      <div className={bottomSection}>
        {onSettings && (
          <Tooltip content="Settings" position="right">
            <button
              className={iconButton}
              onClick={onSettings}
              aria-label="Settings"
            >
              ⚙
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
