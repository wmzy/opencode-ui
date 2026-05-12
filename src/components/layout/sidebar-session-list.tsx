import { css } from '@linaria/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLayout } from '@/context/layout';
import { useNotification } from '@/context/notification';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarSessionItem } from './sidebar-session-item';
import type { Session } from '@/types';

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px 8px;
`;

const skeletonGroup = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 12px;
`;

const emptyState = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  color: var(--color-text-tertiary);
  font-size: 13px;
`;

const sectionLabel = css`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
`;

function LoadingSkeleton() {
  return (
    <div className={skeletonGroup}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="text" height="36px" />
      ))}
    </div>
  );
}

export type SidebarSessionListProps = {
  sessions: Session[];
  loading?: boolean;
  onSelect?: (session: Session) => void;
  onRename?: (id: string, title: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
};

export function SidebarSessionList({
  sessions,
  loading = false,
  onSelect,
  onRename,
  onDelete,
  onArchive,
}: SidebarSessionListProps) {
  const { layout } = useLayout();
  const notification = useNotification();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, sessions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < sessions.length) {
        e.preventDefault();
        onSelect?.(sessions[focusedIndex]);
      }
    },
    [sessions, focusedIndex, onSelect],
  );

  useEffect(() => {
    setFocusedIndex(-1);
  }, [sessions]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (sessions.length === 0) {
    return <div className={emptyState}>No sessions yet</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; sessions: Session[] }[] = [];
  const todaySessions: Session[] = [];
  const yesterdaySessions: Session[] = [];
  const weekSessions: Session[] = [];
  const olderSessions: Session[] = [];

  for (const session of sessions) {
    const updated = new Date(session.time.updated);
    if (updated >= today) {
      todaySessions.push(session);
    } else if (updated >= yesterday) {
      yesterdaySessions.push(session);
    } else if (updated >= weekAgo) {
      weekSessions.push(session);
    } else {
      olderSessions.push(session);
    }
  }

  if (todaySessions.length > 0) groups.push({ label: 'Today', sessions: todaySessions });
  if (yesterdaySessions.length > 0) groups.push({ label: 'Yesterday', sessions: yesterdaySessions });
  if (weekSessions.length > 0) groups.push({ label: 'This Week', sessions: weekSessions });
  if (olderSessions.length > 0) groups.push({ label: 'Older', sessions: olderSessions });

  return (
    <nav
      ref={listRef}
      className={listStyle}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Session list"
    >
      {groups.map((group) => (
        <div key={group.label}>
          <div className={sectionLabel}>{group.label}</div>
          {group.sessions.map((session) => {
            return (
              <SidebarSessionItem
                key={session.id}
                session={session}
                active={layout.activeSessionId === session.id}
                unread={notification.session.unseenCount(session.id) > 0}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
                onArchive={onArchive}
              />
            );
          })}
        </div>
      ))}
    </nav>
  );
}
