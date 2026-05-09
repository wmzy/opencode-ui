import { useState, useCallback, useEffect, useRef } from 'react';
import { useTerminals } from '@/context/terminal';
import { TerminalTab } from './terminal-tab';

type TerminalPanelProps = {
  height?: number;
  onHeightChange?: (height: number) => void;
  className?: string;
};

export function TerminalPanel({
  height = 200,
  onHeightChange,
  className,
}: TerminalPanelProps) {
  const { sessions, activeId, create, remove, setActive, sendInput } = useTerminals();
  const [outputMap, setOutputMap] = useState<Record<string, string[]>>({});
  const wsListenersRef = useRef<Map<string, (ev: MessageEvent) => void>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(height);

  useEffect(() => {
    const handleWsMessage = (id: string) => (ev: MessageEvent) => {
      let data: string;
      if (ev.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(ev.data);
        if (bytes[0] === 0) return;
        data = new TextDecoder().decode(ev.data);
      } else {
        data = String(ev.data);
      }
      setOutputMap((prev) => ({
        ...prev,
        [id]: [...(prev[id] ?? []), data],
      }));
    };

    for (const session of sessions) {
      if (!wsListenersRef.current.has(session.id) && session.ws) {
        const handler = handleWsMessage(session.id);
        wsListenersRef.current.set(session.id, handler);
        session.ws.addEventListener('message', handler);
      }
    }

    return () => {
      for (const [id, handler] of wsListenersRef.current) {
        const session = sessions.find((s) => s.id === id);
        if (session?.ws) {
          session.ws.removeEventListener('message', handler);
        }
      }
    };
  }, [sessions]);

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

  if (sessions.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className={className}
      style={{
        height: currentHeight,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid var(--color-border, #2d333b)',
        background: 'var(--color-panel-bg, #0d1117)',
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
          borderBottom: '1px solid var(--color-border, #2d333b)',
          fontSize: 12,
          gap: 2,
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {sessions.map((session) => (
          <button
            key={session.id}
            role="tab"
            type="button"
            aria-selected={session.id === activeId}
            onClick={() => setActive(session.id)}
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
                  ? '2px solid var(--color-accent, #388bfd)'
                  : '2px solid transparent',
              color: 'inherit',
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
                background: session.connected ? '#3fb950' : '#f85149',
                flexShrink: 0,
              }}
            />
            {session.title}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCreate}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--color-muted, #636e7b)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 8px',
            lineHeight: 1,
          }}
          aria-label="New terminal"
        >
          +
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {sessions.map((session) => (
          <TerminalTab
            key={session.id}
            id={session.id}
            title={session.title}
            connected={session.connected}
            active={session.id === activeId}
            output={outputMap[session.id] ?? []}
            onInput={(data) => sendInput(session.id, data)}
            onClose={() => remove(session.id)}
            onFocus={() => setActive(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
