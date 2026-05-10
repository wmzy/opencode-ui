import { css, cx } from '@linaria/core';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSdk } from '@/context/sdk';
import { useServer } from '@/context/server';
import { useI18n } from '@/context/language';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '@/types/project';

const homeContainer = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  gap: 1.5rem;
  background: var(--color-bg);
`;

const title = css`
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
`;

const subtitle = css`
  font-size: 1rem;
  color: var(--color-text-secondary);
  text-align: center;
`;

const statusRow = css`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
`;

const dot = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.connected { background: var(--color-success); }
  &.disconnected { background: var(--color-error); }
  &.connecting { background: var(--color-warning); animation: pulse 1.5s infinite; }
`;

const projectList = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 480px;
`;

const projectCard = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const projectAvatar = css`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`;

const projectInfo = css`
  flex: 1;
  min-width: 0;
`;

const projectName = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const projectPath = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const emptyState = css`
  color: var(--color-text-tertiary);
  font-size: 14px;
  text-align: center;
  padding: 2rem;
`;

const connectPrompt = css`
  color: var(--color-text-tertiary);
  font-size: 14px;
  text-align: center;
`;

const skeletonGroup = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 480px;
`;

const avatarColors = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

export function HomePage() {
  const { status } = useServer();
  const { client } = useSdk();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'connected') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    client.project.list()
      .then((data) => {
        if (cancelled) return;
        setProjects(data as Project[]);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, status]);

  const handleProjectClick = (project: Project) => {
    const dir = btoa(project.worktree ?? project.id);
    navigate(`/${dir}/session`);
  };

  function getProjectDisplayName(project: Project): string {
    if (project.name) return project.name;
    const segments = project.worktree.replace(/\/+$/, '').split('/');
    return segments[segments.length - 1] || project.id;
  }

  function getProjectDisplayPath(project: Project): string | null {
    if (!project.worktree) return null;
    return project.worktree.replace(/^\/Users\/[^/]+/, '~').replace(/^\/home\/[^/]+/, '~');
  }

  const statusLabel =
    status === 'connected' ? 'Connected' :
      status === 'connecting' ? 'Connecting...' :
        'Disconnected';

  return (
    <div className={homeContainer}>
      <h1 className={title}>{t('app.name')}</h1>
      <p className={subtitle}>{t('app.tagline')}</p>

      <div className={statusRow}>
        <span className={cx(dot, status)} />
        <span>{statusLabel}</span>
      </div>

      {status !== 'connected' && (
        <p className={connectPrompt}>
          Connect to a server to see your projects
        </p>
      )}

      {status === 'connected' && loading && (
        <div className={skeletonGroup}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="text" height="48px" />
          ))}
        </div>
      )}

      {status === 'connected' && !loading && projects.length === 0 && (
        <div className={emptyState}>No projects found</div>
      )}

      {status === 'connected' && !loading && projects.length > 0 && (
        <div className={projectList}>
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={projectCard}
              onClick={() => handleProjectClick(project)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProjectClick(project);
              }}
            >
              <div
                className={projectAvatar}
                style={{ background: project.icon?.color ?? getAvatarColor(i) }}
              >
                {project.icon?.override ?? getProjectDisplayName(project).charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className={projectInfo}>
                <div className={projectName}>{getProjectDisplayName(project)}</div>
                {project.worktree && (
                  <div className={projectPath}>{getProjectDisplayPath(project)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
