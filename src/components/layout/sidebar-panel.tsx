import { css, cx } from '@linaria/core';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLayout } from '@/context/layout';
import { useI18n } from '@/context/language';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarSessionList } from './sidebar-session-list';
import type { Project } from '@/types/project';
import type { Session } from '@/types/session';
import type { OpenCodeSdk } from '@/lib/sdk';

const panelStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--color-bg-secondary);
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  gap: 8px;
  flex-shrink: 0;
`;

const headerTitle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const collapseBtn = css`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: background 0.15s, color 0.15s;
  background: none;
  border: none;
  flex-shrink: 0;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const searchSection = css`
  padding: 0 12px 8px;
  flex-shrink: 0;
`;

const searchInput = css`
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 13px;
  padding: 6px 10px;
  width: 100%;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: var(--color-text-tertiary);
  }

  &:focus {
    border-color: var(--color-accent);
  }
`;

const newSessionBtn = css`
  margin: 0 12px 8px;
  flex-shrink: 0;
`;

const listSection = css`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const sectionLabel = css`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
`;

function isSession(value: unknown): value is Session {
  return typeof value === 'object' && value !== null && 'id' in value && 'title' in value;
}

function getProjectDisplayName(project: Project): string {
  if (project.name) return project.name;
  const segments = project.worktree.replace(/\/+$/, '').split('/');
  return segments[segments.length - 1] || project.id;
}

export type SidebarPanelProps = {
  project?: Project | null;
  projectSdk: OpenCodeSdk;
};

export function SidebarPanel({ project, projectSdk }: SidebarPanelProps) {
  const { toggleSidebar } = useLayout();
  const { t } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
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
    return () => { mountedRef.current = false; };
  }, [projectSdk]);

  const filtered = search
    ? sessions.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()),
      )
    : sessions;

  const displayName = project
    ? getProjectDisplayName(project)
    : 'OpenCode';

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

  return (
    <div className={panelStyle}>
      <div className={headerStyle}>
        <span className={headerTitle}>{displayName}</span>
        <button
          className={collapseBtn}
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
        >
          ◀
        </button>
      </div>

      <div className={searchSection}>
        <input
          className={searchInput}
          type="text"
          placeholder={t('sidebar.search') !== 'sidebar.search' ? t('sidebar.search') : 'Search sessions...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={newSessionBtn}>
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
          <div className={sectionLabel}>Sessions</div>
          <SidebarSessionList
            sessions={filtered}
            loading={loading}
          />
        </ScrollArea>
      </div>
    </div>
  );
}
