import { useRef, useEffect } from 'react';
import type { Terminal as Term, FitAddon, Ghostty } from 'ghostty-web';
import type { LocalPTY } from '@/context/terminal';
import { useSdk } from '@/context/sdk';
import { useServer } from '@/context/server';
import { useTheme } from '@/context/theme';
import { terminalWriter } from '@/lib/terminal-writer';
import { terminalWebSocketURL } from '@/lib/terminal-websocket-url';

function readCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildTerminalColors() {
  const bg = readCSSVar('--background-base') || readCSSVar('--color-bg') || '#0a0a0a';
  const fg = readCSSVar('--text-strong') || readCSSVar('--color-text') || '#e5e5e5';
  return {
    background: bg,
    foreground: fg,
    cursor: fg,
    selectionBackground: 'rgba(212, 212, 212, 0.25)',
  };
}

type TerminalTabProps = {
  pty: LocalPTY;
  active: boolean;
  directory?: string;
  autoFocus?: boolean;
  onConnect?: () => void;
  onConnectError?: (error: unknown) => void;
  onCleanup?: (pty: Partial<LocalPTY> & { id: string }) => void;
};

type GhosttyModule = typeof import('ghostty-web');

let shared: Promise<{ mod: GhosttyModule; ghostty: Ghostty }> | undefined;

const loadGhostty = () => {
  if (shared) return shared;
  shared = import('ghostty-web')
    .then(async (mod) => ({ mod, ghostty: await mod.Ghostty.load() }))
    .catch((err) => {
      shared = undefined;
      throw err;
    });
  return shared;
};

export function TerminalTab({
  pty,
  active,
  directory,
  autoFocus = true,
  onConnect,
  onConnectError,
  onCleanup,
}: TerminalTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Term | null>(null);
  const { client, baseUrl, getSdk } = useSdk();
  const { active: serverConn } = useServer();
  const { mode } = useTheme();

  const directoryRef = useRef(directory);
  directoryRef.current = directory;

  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;
  const onConnectErrorRef = useRef(onConnectError);
  onConnectErrorRef.current = onConnectError;
  const onCleanupRef = useRef(onCleanup);
  onCleanupRef.current = onCleanup;
  const clientRef = useRef(client);
  clientRef.current = client;
  const getSdkRef = useRef(getSdk);
  getSdkRef.current = getSdk;
  const baseUrlRef = useRef(baseUrl);
  baseUrlRef.current = baseUrl;
  const serverConnRef = useRef(serverConn);
  serverConnRef.current = serverConn;
  const autoFocusRef = useRef(autoFocus);
  autoFocusRef.current = autoFocus;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let term: Term | undefined;
    let fitAddon: FitAddon | undefined;
    let ws: WebSocket | undefined;
    let output: ReturnType<typeof terminalWriter> | undefined;
    let drop: VoidFunction | undefined;
    let reconn: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    let cursor = 0;
    const cleanups: VoidFunction[] = [];

    const id = pty.id;
    const restore = typeof pty.buffer === 'string' ? pty.buffer : '';
    const restoreSize =
      restore &&
      typeof pty.cols === 'number' &&
      Number.isSafeInteger(pty.cols) &&
      pty.cols > 0 &&
      typeof pty.rows === 'number' &&
      Number.isSafeInteger(pty.rows) &&
      pty.rows > 0
        ? { cols: pty.cols, rows: pty.rows }
        : undefined;
    const scrollY = typeof pty.scrollY === 'number' ? pty.scrollY : undefined;
    const start =
      typeof pty.cursor === 'number' && Number.isSafeInteger(pty.cursor)
        ? pty.cursor
        : undefined;
    let seek = start ?? (restore ? -1 : 0);
    cursor = start ?? 0;

    const cleanup = () => {
      const fns = cleanups.splice(0).reverse();
      for (const fn of fns) {
        try {
          fn();
        } catch {
          // ignore
        }
      }
    };

    const scheduleSize = (() => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let pending: { cols: number; rows: number } | undefined;
      let last: { cols: number; rows: number } | undefined;

      const push = (cols: number, rows: number) => {
        if (disposed) return;
        if (last?.cols === cols && last?.rows === rows) return;
        pending = { cols, rows };
        if (!last) {
          last = pending;
          void clientRef.current.pty
            .update(id, { body: { size: { cols, rows } } })
            .catch(() => {});
          return;
        }
        if (timer !== undefined) return;
        timer = setTimeout(() => {
          timer = undefined;
          const next = pending;
          if (!next) return;
          pending = undefined;
          if (disposed) return;
          if (last?.cols === next.cols && last?.rows === next.rows) return;
          last = next;
          void clientRef.current.pty
            .update(id, { body: { size: { cols: next.cols, rows: next.rows } } })
            .catch(() => {});
        }, 100);
      };

      push.dispose = () => {
        if (timer !== undefined) clearTimeout(timer);
      };
      return push;
    })();

    const scheduleFit = (() => {
      let frame: number | undefined;
      return () => {
        if (disposed) return;
        if (!fitAddon) return;
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          if (disposed) return;
          fitAddon!.fit();
        });
      };
    })();

    const fail = (err: unknown) => {
      if (disposed) return;
      onConnectErrorRef.current?.(err);
    };

    const gone = () => {
      const scopedClient = directoryRef.current
        ? getSdkRef.current(directoryRef.current)
        : clientRef.current;
      return scopedClient.pty
        .get(id)
        .then(() => false)
        .catch((err: unknown) => {
          if (
            err &&
            typeof err === 'object' &&
            'status' in err &&
            (err as { status: number }).status === 404
          )
            return true;
          return false;
        });
    };

    const connectToken = async () => {
      const scopedClient = directoryRef.current
        ? getSdkRef.current(directoryRef.current)
        : clientRef.current;
      const result = await scopedClient.pty.connectToken(id, {
        headers: { 'x-opencode-ticket': '1' },
      });
      return result.ticket;
    };

    const retry = (err: unknown) => {
      if (disposed) return;
      if (reconn !== undefined) return;
      const ms = Math.min(250 * 2 ** Math.min(tries, 4), 4_000);
      reconn = setTimeout(async () => {
        reconn = undefined;
        if (disposed) return;
        if (await gone()) {
          if (disposed) return;
          fail(err);
          return;
        }
        if (disposed) return;
        tries += 1;
        open();
      }, ms);
    };

    const open = async () => {
      if (disposed) return;
      drop?.();

      const ticket = await connectToken().catch((err) => {
        fail(err);
        return undefined;
      });
      if (disposed) return;

      const sameOrigin =
        new URL(baseUrlRef.current, location.href).origin === location.origin;
      const conn = serverConnRef.current;
      const username = conn?.username ?? 'opencode';
      const password = conn?.password ?? '';

      const socket = new WebSocket(
        terminalWebSocketURL({
          url: baseUrlRef.current,
          id,
          directory: directoryRef.current,
          cursor: seek,
          ticket,
          sameOrigin,
          username,
          password,
          authToken: !!(conn?.username ?? conn?.password),
        }).toString(),
      );
      socket.binaryType = 'arraybuffer';
      ws = socket;

      const decoder = new TextDecoder();
      let once = false;

      const handleOpen = () => {
        if (disposed) return;
        tries = 0;
        onConnectRef.current?.();
        if (term) scheduleSize(term.cols, term.rows);
      };

      const handleMessage = (event: MessageEvent) => {
        if (disposed) return;
        if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data);
          if (bytes[0] !== 0) return;
          const json = decoder.decode(bytes.subarray(1));
          try {
            const meta = JSON.parse(json) as { cursor?: unknown };
            const next = meta?.cursor;
            if (
              typeof next === 'number' &&
              Number.isSafeInteger(next) &&
              next >= 0
            ) {
              cursor = next;
              seek = next;
            }
          } catch {
            // ignore
          }
          return;
        }
        const data = typeof event.data === 'string' ? event.data : '';
        if (!data) return;
        output?.push(data);
        cursor += data.length;
        seek = cursor;
      };

      const handleError = () => {
        if (disposed) return;
      };

      const stop = () => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('message', handleMessage);
        socket.removeEventListener('error', handleError);
        socket.removeEventListener('close', handleClose);
        if (ws === socket) ws = undefined;
        if (drop === stop) drop = undefined;
        if (
          socket.readyState !== WebSocket.CLOSED &&
          socket.readyState !== WebSocket.CLOSING
        )
          socket.close(1000);
      };

      const handleClose = (event: CloseEvent) => {
        if (ws === socket) ws = undefined;
        if (drop === stop) drop = undefined;
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('message', handleMessage);
        socket.removeEventListener('error', handleError);
        socket.removeEventListener('close', handleClose);
        if (disposed) return;
        if (event.code === 1000) return;
        if (once) return;
        once = true;
        retry(new Error(`Connection closed (code: ${event.code})`));
      };

      drop = stop;
      socket.addEventListener('open', handleOpen);
      socket.addEventListener('message', handleMessage);
      socket.addEventListener('error', handleError);
      socket.addEventListener('close', handleClose);
    };

    const run = async () => {
      const loaded = await loadGhostty();
      if (disposed) return;

      const mod = loaded.mod;
      const g = loaded.ghostty;

      const t = new mod.Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        cols: restoreSize?.cols,
        rows: restoreSize?.rows,
        fontSize: 14,
        fontFamily: 'monospace',
        allowTransparency: false,
        convertEol: false,
        theme: buildTerminalColors(),
        scrollback: 10_000,
        ghostty: g,
      });
      cleanups.push(() => t.dispose());
      if (disposed) {
        cleanup();
        return;
      }

      term = t;
      termRef.current = t;
      output = terminalWriter((data, done) => {
        t.write(data, done);
      });

      t.attachCustomKeyEventHandler((event) => {
        const key = event.key.toLowerCase();
        if (event.ctrlKey && event.shiftKey && !event.metaKey && key === 'c') {
          document.execCommand('copy');
          return true;
        }
        return false;
      });

      const fit = new mod.FitAddon();
      cleanups.push(() => fit.dispose());
      t.loadAddon(fit);
      fitAddon = fit;

      t.open(container);

      if (t.textarea) {
        const ta = t.textarea;
        ta.style.width = '100%';
        ta.style.height = '100%';
        ta.style.opacity = '0';
        ta.style.clipPath = 'none';
        ta.style.fontSize = '16px';
        ta.style.position = 'absolute';
        ta.style.left = '0';
        ta.style.top = '0';
        ta.style.zIndex = '1';
        ta.style.color = 'transparent';
        ta.style.background = 'transparent';
        ta.style.caretColor = 'transparent';
        ta.style.resize = 'none';
        ta.style.outline = 'none';
        ta.style.border = 'none';
        ta.style.padding = '0';
        ta.style.margin = '0';
        ta.style.overflow = 'hidden';
        ta.style.whiteSpace = 'nowrap';
        ta.style.webkitAppearance = 'none';

        const ZWS = '\u200B';

        const send = (data: string) => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(data);
        };

        // ghostty-web container has beforeinput→preventDefault() and
        // InputHandler compositionend on container — isolate textarea
        const handleBeforeInput = (e: InputEvent) => {
          e.stopPropagation();
          switch (e.inputType) {
            case 'deleteContentBackward':
              e.preventDefault();
              send('\x7f');
              ta.value = ZWS;
              break;
            case 'deleteContentForward':
              e.preventDefault();
              send('\x1b[3~');
              ta.value = ZWS;
              break;
            case 'insertLineBreak':
              e.preventDefault();
              send('\r');
              ta.value = ZWS;
              break;
            case 'insertText':
              e.preventDefault();
              if (e.data) send(e.data);
              ta.value = ZWS;
              break;
            case 'insertCompositionText':
              break;
            default:
              e.preventDefault();
              ta.value = ZWS;
          }
        };
        ta.addEventListener('beforeinput', handleBeforeInput, true);
        cleanups.push(() =>
          ta.removeEventListener('beforeinput', handleBeforeInput, true),
        );

        const handleCompositionEnd = (e: CompositionEvent) => {
          e.stopPropagation();
          if (e.data) send(e.data);
          ta.value = ZWS;
        };
        ta.addEventListener('compositionend', handleCompositionEnd, true);
        cleanups.push(() =>
          ta.removeEventListener('compositionend', handleCompositionEnd, true),
        );

        const stopBubble = (e: Event) => e.stopPropagation();
        ta.addEventListener('compositionstart', stopBubble, true);
        ta.addEventListener('compositionupdate', stopBubble, true);
        cleanups.push(() => {
          ta.removeEventListener('compositionstart', stopBubble, true);
          ta.removeEventListener('compositionupdate', stopBubble, true);
        });

        ta.value = ZWS;
      }

      const focusTerminal = () => {
        t.focus();
        t.textarea?.focus();
        setTimeout(() => t.textarea?.focus(), 0);
      };

      const handlePointerDown = () => {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          active !== container &&
          !container.contains(active)
        ) {
          active.blur();
        }
        focusTerminal();
      };

      container.addEventListener('pointerdown', handlePointerDown);
      cleanups.push(() =>
        container.removeEventListener('pointerdown', handlePointerDown),
      );

      const handleTextareaFocus = () => {
        t.options.cursorBlink = true;
      };
      const handleTextareaBlur = () => {
        t.options.cursorBlink = false;
      };
      t.textarea?.addEventListener('focus', handleTextareaFocus);
      t.textarea?.addEventListener('blur', handleTextareaBlur);
      cleanups.push(() =>
        t.textarea?.removeEventListener('focus', handleTextareaFocus),
      );
      cleanups.push(() =>
        t.textarea?.removeEventListener('blur', handleTextareaBlur),
      );

      const handleCopy = (event: ClipboardEvent) => {
        const selection = t.getSelection();
        if (!selection) return;
        const clipboard = event.clipboardData;
        if (!clipboard) return;
        event.preventDefault();
        clipboard.setData('text/plain', selection);
      };

      const handlePaste = (event: ClipboardEvent) => {
        const clipboard = event.clipboardData;
        const text =
          clipboard?.getData('text/plain') ?? clipboard?.getData('text') ?? '';
        if (!text) return;
        event.preventDefault();
        event.stopPropagation();
        t.paste(text);
      };

      container.addEventListener('copy', handleCopy, true);
      cleanups.push(() =>
        container.removeEventListener('copy', handleCopy, true),
      );
      container.addEventListener('paste', handlePaste, true);
      cleanups.push(() =>
        container.removeEventListener('paste', handlePaste, true),
      );

      if (autoFocusRef.current) {
        t.focus();
        t.textarea?.focus();
        setTimeout(() => t.textarea?.focus(), 0);
      }

      if (typeof document !== 'undefined' && document.fonts) {
        void document.fonts.ready.then(scheduleFit);
      }

      const onResize = t.onResize((size) => {
        scheduleSize(size.cols, size.rows);
      });
      cleanups.push(() => onResize.dispose());

      const onData = t.onData((data) => {
        if (ws?.readyState === WebSocket.OPEN) ws.send(data);
      });
      cleanups.push(() => onData.dispose());

      const write = (data: string) =>
        new Promise<void>((resolve) => {
          if (!output) {
            resolve();
            return;
          }
          output.push(data);
          output.flush(resolve);
        });

      if (restore && restoreSize) {
        await write(restore);
        fit.fit();
        scheduleSize(t.cols, t.rows);
        if (scrollY !== undefined) t.scrollToLine(scrollY);
      } else {
        fit.fit();
        scheduleSize(t.cols, t.rows);
        if (restore) {
          await write(restore);
          if (scrollY !== undefined) t.scrollToLine(scrollY);
        }
      }

      fit.observeResize();
      const handleWindowResize = () => scheduleFit();
      window.addEventListener('resize', handleWindowResize);
      cleanups.push(() =>
        window.removeEventListener('resize', handleWindowResize),
      );

      open();
    };

    void run().catch((err) => {
      if (disposed) return;
      fail(err);
    });

    return () => {
      disposed = true;
      termRef.current = null;
      if (reconn !== undefined) clearTimeout(reconn);
      drop?.();
      if (
        ws &&
        ws.readyState !== WebSocket.CLOSED &&
        ws.readyState !== WebSocket.CLOSING
      ) {
        ws.close(1000);
      }

      const finalize = () => {
        if (term) {
          onCleanupRef.current?.({
            id,
            cursor,
            rows: term.rows,
            cols: term.cols,
            scrollY: term.getViewportY(),
          });
        }
        scheduleSize.dispose?.();
        cleanup();
      };

      if (!output) {
        finalize();
        return;
      }

      output.flush(finalize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pty.id]);

  useEffect(() => {
    const t = termRef.current;
    if (!t) return;
    try {
      t.setTheme(buildTerminalColors());
    } catch {
      // ignore
    }
  }, [mode]);

  return (
    <div
      role="tabpanel"
      style={{
        display: active ? 'block' : 'none',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'var(--background-base, var(--color-bg, #0a0a0a))',
      }}
    >
      <div
        ref={containerRef}
        data-component="terminal"
        style={{
          width: '100%',
          height: '100%',
          padding: '0',
          fontFamily: 'monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
