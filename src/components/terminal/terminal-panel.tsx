import { useState, useCallback, useEffect, useRef } from 'react';
import { useTerminals } from '@/context/terminal';
import { useI18n } from '@/context/language';
import { TerminalTab } from './terminal-tab';

type TerminalPanelProps = {
  height?: number;
  onHeightChange?: (height: number) => void;
  directory?: string;
  className?: string;
  onClose?: () => void;
};

export function TerminalPanel({
  height = 200,
  onHeightChange,
  directory,
  className,
  onClose,
}: TerminalPanelProps) {
  const { t } = useI18n();
  const { sessions, activeId, create, close, open, update, trim, setDirectory } =
    useTerminals();
  const [currentHeight, setCurrentHeight] = useState(height);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [resizing, setResizing] = useState(false);
  const autoCreatedRef = useRef(false);
  const userClosedRef = useRef(false);

  const prevDirectoryRef = useRef(directory);
  const closingRef = useRef(false);

  useEffect(() => {
    setDirectory(directory);
    if (prevDirectoryRef.current !== undefined && prevDirectoryRef.current !== directory && sessions.length > 0) {
      closingRef.current = true;
      userClosedRef.current = false;
      Promise.all(sessions.map(s => close(s.id))).then(() => {
        closingRef.current = false;
        autoCreatedRef.current = false;
      });
    }
    prevDirectoryRef.current = directory;
  }, [directory, setDirectory, sessions, close]);

  useEffect(() => {
    if (sessions.length === 0 && !autoCreatedRef.current && !closingRef.current && !userClosedRef.current) {
      autoCreatedRef.current = true;
      void create();
    }
  }, [sessions.length, create]);

  useEffect(() => {
    if (sessions.length > 0) {
      autoCreatedRef.current = false;
    }
  }, [sessions.length]);

  const handleClose = useCallback(
    (id: string) => {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length === 0) {
        userClosedRef.current = true;
        void close(id);
        onClose?.();
      } else {
        void close(id);
      }
    },
    [sessions, close, onClose],
  );

  const handleCreate = useCallback(async () => {
    await create();
  }, [create]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setResizing(true);
      const startY = e.clientY;
      const startH = currentHeight;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY;
        const next = Math.max(100, Math.min(600, startH + delta));
        setCurrentHeight(next);
        onHeightChange?.(next);
      };

      const onMouseUp = () => {
        setResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [currentHeight, onHeightChange],
  );

  const handleConnect = useCallback(
    (id: string) => {
      setConnected((prev) => ({ ...prev, [id]: true }));
      trim(id);
    },
    [trim],
  );

  const handleCleanup = useCallback(
    (pty: Partial<import('@/context/terminal').LocalPTY> & { id: string }) => {
      update(pty);
    },
    [update],
  );

  if (sessions.length === 0) return null;

  const activePty = sessions.find((s) => s.id === activeId);

  return (
    <div
      className={className}
      style={{
        height: currentHeight,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        userSelect: resizing ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          height: 4,
          cursor: 'row-resize',
          background: 'transparent',
          flexShrink: 0,
        }}
        onMouseDown={handleResizeStart}
      />
      <div
        role="tablist"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 12,
          gap: 2,
          flexShrink: 0,
          overflowX: 'auto',
          background: 'var(--color-bg-secondary)',
        }}
      >
        {sessions.map((session) => (
          <div
            key={session.id}
            role="tab"
            aria-selected={session.id === activeId}
            onClick={() => open(session.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background:
                session.id === activeId
                  ? 'var(--color-active, rgba(56,139,253,0.15))'
                  : 'transparent',
              border: 'none',
              borderBottom:
                session.id === activeId
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              color: 'var(--color-text, inherit)',
              cursor: 'pointer',
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: connected[session.id] ? 'var(--color-success)' : 'var(--color-error)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.title}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(session.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 4px',
                lineHeight: 1,
              }}
              aria-label={`Close ${session.title}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleCreate}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 8px',
            lineHeight: 1,
          }}
          aria-label={t('terminal.new')}
        >
          +
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activePty && (
          <TerminalTab
            key={activePty.id}
            pty={activePty}
            active={true}
            directory={directory}
            autoFocus={true}
            onConnect={() => handleConnect(activePty.id)}
            onCleanup={handleCleanup}
          />
        )}
      </div>
    </div>
  );
}
