import { css, cx } from '@linaria/core';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayout } from '@/context/layout';
import { useSync } from '@/context/sync';
import type { Session } from '@/types';

const itemStyle = css`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  margin: 0 4px;
  transition: background 0.1s;
  min-height: 44px;

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &.active {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }
`;

const itemRow = css`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const titleStyle = css`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const titleInput = css`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-accent);
  border-radius: 4px;
  padding: 1px 4px;
  outline: none;
  width: 100%;
  font-family: inherit;
`;

const timeStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const hoverActions = css`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s;

  .${itemStyle}:hover & {
    opacity: 1;
    pointer-events: auto;
  }
`;

const actionBtn = css`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-family: inherit;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  &.danger:hover {
    background: color-mix(in srgb, var(--color-error) 15%, transparent);
    color: var(--color-error);
  }
`;

const contextMenu = css`
  position: fixed;
  z-index: 1100;
  min-width: 140px;
  padding: 4px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
`;

const contextMenuItem = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 4px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &.danger {
    color: var(--color-error);
  }

  &.danger:hover {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
  }
`;

const unreadDot = css`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  flex-shrink: 0;
`;

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export type SidebarSessionItemProps = {
  session: Session;
  active?: boolean;
  onSelect?: (session: Session) => void;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  unread?: boolean;
};

export function SidebarSessionItem({
  session,
  active = false,
  onSelect,
  onRename,
  onDelete,
  onArchive,
  unread = false,
}: SidebarSessionItemProps) {
  const { setActiveSession } = useLayout();
  const { deleteSession, updateSession, archiveSession } = useSync();
  const navigate = useNavigate();
  const { dir } = useParams<{ dir: string }>();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = useCallback(() => {
    if (editing) return;
    setActiveSession(session.id);
    onSelect?.(session);
    if (dir) {
      navigate(`/${dir}/session/${session.id}`);
    }
  }, [editing, session, setActiveSession, onSelect, navigate, dir]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(session.title);
    setEditing(true);
  }, [session.title]);

  const commitRename = useCallback(async () => {
    const trimmed = editValue.trim();
    setEditing(false);
    if (trimmed && trimmed !== session.title) {
      try {
        await updateSession(session.id, { title: trimmed });
        onRename?.(session.id, trimmed);
      } catch {
        setEditValue(session.title);
      }
    }
  }, [editValue, session.id, session.title, updateSession, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  }, [commitRename]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  const handleDelete = useCallback(async () => {
    closeMenu();
    await deleteSession(session.id);
    onDelete?.(session.id);
  }, [closeMenu, deleteSession, session.id, onDelete]);

  const handleArchive = useCallback(async () => {
    closeMenu();
    await archiveSession(session.id);
    onArchive?.(session.id);
  }, [closeMenu, archiveSession, session.id, onArchive]);

  const handleStartRename = useCallback(() => {
    closeMenu();
    setEditValue(session.title);
    setEditing(true);
  }, [closeMenu, session.title]);

  return (
    <>
      <div
        className={cx(itemStyle, active && 'active')}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        aria-current={active ? 'true' : undefined}
      >
        <div className={itemRow}>
          {editing ? (
            <input
              ref={inputRef}
              className={titleInput}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className={titleStyle}>{session.title || 'Untitled'}</span>
              {unread && <span className={unreadDot} />}
            </>
          )}
        </div>
        {!editing && (
          <span className={timeStyle}>
            {formatRelativeTime(session.time.updated)}
          </span>
        )}

        {!editing && (
          <div className={hoverActions}>
            <button
              className={cx(actionBtn, 'danger')}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              aria-label="Delete session"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {menuPos && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1099 }}
            onClick={closeMenu}
          />
          <div
            className={contextMenu}
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button className={contextMenuItem} onClick={handleStartRename}>
              Rename
            </button>
            <button className={contextMenuItem} onClick={handleArchive}>
              Archive
            </button>
            <button className={cx(contextMenuItem, 'danger')} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
