import { css, cx } from '@linaria/core';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSdk } from '@/context/sdk';
import { useServer } from '@/context/server';
import { useI18n } from '@/context/language';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const connectSection = css`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const savedServersList = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const savedServerCard = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-focus);
  }
`;

const savedServerInfo = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const savedServerName = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const savedServerUrl = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const savedServerDot = css`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  flex-shrink: 0;

  &.active {
    background: var(--color-success);
  }
`;

const formDivider = css`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-tertiary);
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
`;

const connectForm = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const authRow = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

function extractHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function ServerConnectForm() {
  const { addServer, setActive, servers } = useServer();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (!name) {
      setName(extractHost(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    if (!trimmedUrl) return;

    const serverName = name.trim() || extractHost(trimmedUrl);
    const id = addServer({
      name: serverName,
      url: trimmedUrl,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    });
    setActive(id);
  };

  const otherServers = servers.filter(s => {
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    return !trimmedUrl || s.url !== trimmedUrl;
  });

  return (
    <div className={connectSection}>
      {otherServers.length > 0 && (
        <div className={savedServersList}>
          {otherServers.map(server => (
            <div
              key={server.id}
              className={savedServerCard}
              onClick={() => setActive(server.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setActive(server.id); }}
            >
              <span className={savedServerDot} />
              <div className={savedServerInfo}>
                <span className={savedServerName}>{server.name}</span>
                <span className={savedServerUrl}>{server.url}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {otherServers.length > 0 && <div className={formDivider}>or add new</div>}

      <form className={connectForm} onSubmit={handleSubmit}>
        <Input
          label="Server URL"
          placeholder="http://localhost:4099"
          value={url}
          onChange={e => handleUrlChange(e.currentTarget.value)}
          size="md"
          autoComplete="url"
        />
        <Input
          label="Name"
          placeholder="My Server"
          value={name}
          onChange={e => setName(e.currentTarget.value)}
          size="md"
        />
        <div className={authRow}>
          <Input
            label="Username"
            placeholder="Optional"
            value={username}
            onChange={e => setUsername(e.currentTarget.value)}
            size="md"
            autoComplete="username"
          />
          <Input
            label="Password"
            placeholder="Optional"
            type="password"
            value={password}
            onChange={e => setPassword(e.currentTarget.value)}
            size="md"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" fullWidth disabled={!url.trim()}>
          Connect
        </Button>
      </form>
    </div>
  );
}

export function HomePage() {
  const { status, active } = useServer();
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

      {status === 'connected' && active && (
        <div className={statusRow}>
          <span className={cx(dot, status)} />
          <span>{statusLabel} — {active.name}</span>
        </div>
      )}

      {status === 'connecting' && (
        <div className={statusRow}>
          <span className={cx(dot, status)} />
          <span>{statusLabel}</span>
        </div>
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

      {(status === 'disconnected' || status === 'error') && (
        <ServerConnectForm />
      )}
    </div>
  );
}
