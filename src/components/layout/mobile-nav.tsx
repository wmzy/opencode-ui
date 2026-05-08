import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useServer } from '@/context/server';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarSessionList } from './sidebar-session-list';
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
  width: min(280px, 85vw);
  z-index: 50;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: pan-y;

  &.closed {
    transform: translateX(-100%);
  }
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

const statusRow = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 12px;
  flex-shrink: 0;
`;

const statusDot = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.connected { background: var(--color-success); }
  &.disconnected { background: var(--color-error); }
  &.connecting { background: var(--color-warning); }
`;

const statusText = css`
  font-size: 13px;
  color: var(--color-text-secondary);
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

function isSession(value: unknown): value is Session {
  return typeof value === 'object' && value !== null && 'id' in value && 'title' in value;
}

export type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  projectSdk: OpenCodeSdk;
};

export function MobileNav({ open, onClose, project, projectSdk }: MobileNavProps) {
  const { status } = useServer();
  const isConnected = status === 'connected';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    return () => { mountedRef.current = false; };
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

  const displayName = project
    ? (project.name || project.worktree.replace(/\/+$/, '').split('/').pop() || 'OpenCode')
    : 'OpenCode';

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
        <div className={swipeHandle} />

        <div className={sheetHeader}>
          <span className={sheetTitle}>{displayName}</span>
          <button className={closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={statusRow}>
          <div className={cx(statusDot, isConnected ? 'connected' : status)} />
          <span className={statusText}>
            {isConnected ? 'Connected' : status}
          </span>
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
            />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
