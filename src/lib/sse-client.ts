import { authTokenFromCredentials } from './base64';

export interface SSEEvent {
  id?: string;
  type: string;
  data: unknown;
  directory?: string;
}

export interface SSEClientOptions {
  baseUrl: string;
  path?: string;
  directory?: string;
  auth?: { username?: string; password: string };
  headers?: Record<string, string>;
  heartbeatTimeoutMs?: number;
  coalesceFrameMs?: number;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

type EventListener = (event: SSEEvent) => void;

interface CoalescedEvent {
  directory: string;
  payload: SSEEvent;
}

function parseSSELines(chunk: string): Array<{ type: string; data: string }> {
  const events: Array<{ type: string; data: string }> = [];
  const lines = chunk.split('\n');
  let currentType = '';
  let currentData: string[] = [];

  const flush = () => {
    if (currentData.length > 0 || currentType) {
      events.push({
        type: currentType || 'message',
        data: currentData.join('\n'),
      });
      currentType = '';
      currentData = [];
    }
  };

  for (const line of lines) {
    if (line === '') {
      flush();
      continue;
    }
    if (line.startsWith('event:')) {
      currentType = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      currentData.push(line.slice(5).trimStart());
    } else if (line.startsWith('id:')) {
      // event ID - not currently used
    } else if (line.startsWith(':')) {
      // comment (heartbeat)
    } else if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const field = line.slice(0, colonIndex);
      const value = line.slice(colonIndex + 1).trimStart();
      if (field === 'event') {
        currentType = value;
      } else if (field === 'data') {
        currentData.push(value);
      }
    }
  }
  flush();

  return events;
}

export function createSSEClient(options: SSEClientOptions) {
  const {
    baseUrl,
    path = '/global/event',
    directory,
    auth,
    headers: extraHeaders,
    heartbeatTimeoutMs = 15_000,
    coalesceFrameMs = 16,
    reconnectDelayMs = 250,
    maxReconnectDelayMs = 30_000,
  } = options;

  const listeners = new Set<EventListener>();
  const errorListeners = new Set<(error: unknown) => void>();
  let abortController: AbortController | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let heartbeatTimer: ReturnType<typeof setTimeout> | undefined;
  let started = false;
  let lastEventAt = 0;
  let reconnectAttempt = 0;

  const coalesced = new Map<string, number>();
  const staleDeltas = new Set<string>();
  let queue: CoalescedEvent[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | undefined;

  const deltaKey = (dir: string, msgId: string, partId: string) =>
    `${dir}:${msgId}:${partId}`;

  const eventKey = (dir: string, event: SSEEvent): string | undefined => {
    if (event.type === 'session.status')
      return `session.status:${dir}:${String((event.data as Record<string, unknown>)?.sessionID)}`;
    if (event.type === 'lsp.updated') return `lsp.updated:${dir}`;
    if (event.type === 'message.part.updated') {
      const part = event.data as Record<string, unknown>;
      return `message.part.updated:${dir}:${String(part.messageID)}:${String(part.id)}`;
    }
    return undefined;
  };

  const flushQueue = () => {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = undefined;

    if (queue.length === 0) return;

    const events = queue;
    const skip = staleDeltas.size > 0 ? new Set(staleDeltas) : undefined;
    queue = [];
    coalesced.clear();
    staleDeltas.clear();

    for (const event of events) {
      if (skip && event.payload.type === 'message.part.delta') {
        const props = event.payload.data as Record<string, unknown>;
        if (skip.has(deltaKey(event.directory, String(props.messageID), String(props.partID))))
          continue;
      }
      for (const listener of listeners) {
        listener(event.payload);
      }
    }
  };

  const scheduleFlush = () => {
    if (flushTimer) return;
    const elapsed = Date.now() - lastEventAt;
    flushTimer = setTimeout(flushQueue, Math.max(0, coalesceFrameMs - elapsed));
  };

  const resetHeartbeat = () => {
    lastEventAt = Date.now();
    if (heartbeatTimer) clearTimeout(heartbeatTimer);
    heartbeatTimer = setTimeout(() => {
      abortController?.abort();
    }, heartbeatTimeoutMs);
  };

  const clearHeartbeat = () => {
    if (!heartbeatTimer) return;
    clearTimeout(heartbeatTimer);
    heartbeatTimer = undefined;
  };

  const buildUrl = (): string => {
    const url = new URL(path, baseUrl);
    if (directory) url.searchParams.set('directory', directory);
    return url.toString();
  };

  const buildHeaders = (): Record<string, string> => {
    const hdrs: Record<string, string> = {
      Accept: 'text/event-stream',
      ...extraHeaders,
    };
    if (auth) {
      hdrs['Authorization'] = `Basic ${authTokenFromCredentials(auth)}`;
    }
    return hdrs;
  };

  const processChunk = (text: string) => {
    const parsed = parseSSELines(text);
    for (const { type, data } of parsed) {
      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch {
        payload = data;
      }

      const event: SSEEvent = {
        type,
        data: payload,
        directory,
      };

      if (typeof payload === 'object' && payload !== null) {
        const obj = payload as Record<string, unknown>;
        if (obj.type) event.type = String(obj.type);
        if (obj.directory) event.directory = String(obj.directory);
        if (obj.payload) event.data = obj.payload;
        if (obj.type === 'sync') continue;
      }

      const dir = event.directory ?? directory ?? 'global';
      const k = eventKey(dir, event);
      if (k) {
        const i = coalesced.get(k);
        if (i !== undefined) {
          queue[i] = { directory: dir, payload: event };
          if (event.type === 'message.part.updated') {
            const part = event.data as Record<string, unknown>;
            staleDeltas.add(deltaKey(dir, String(part.messageID), String(part.id)));
          }
          continue;
        }
        coalesced.set(k, queue.length);
      }
      queue.push({ directory: dir, payload: event });
      scheduleFlush();
    }
  };

  const connect = async () => {
    abortController = new AbortController();
    lastEventAt = Date.now();
    resetHeartbeat();

    try {
      const response = await fetch(buildUrl(), {
        method: 'GET',
        headers: buildHeaders(),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      const body = response.body;
      if (!body) {
        throw new Error('No response body for SSE stream');
      }

      reconnectAttempt = 0;

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetHeartbeat();
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (part.trim()) processChunk(part);
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      for (const listener of errorListeners) {
        listener(error);
      }
    } finally {
      clearHeartbeat();
      abortController = undefined;
    }

    if (!started) return;

    const delay = Math.min(
      reconnectDelayMs * Math.pow(2, reconnectAttempt),
      maxReconnectDelayMs,
    );
    reconnectAttempt++;
    reconnectTimer = setTimeout(connect, delay);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible') return;
    if (!started) return;
    if (Date.now() - lastEventAt < heartbeatTimeoutMs) return;
    abortController?.abort();
  };

  const start = () => {
    if (started) return;
    started = true;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    connect();
  };

  const stop = () => {
    started = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
    abortController?.abort();
    clearHeartbeat();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    flushQueue();
  };

  return {
    start,
    stop,
    on(listener: EventListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onError(listener: (error: unknown) => void): () => void {
      errorListeners.add(listener);
      return () => errorListeners.delete(listener);
    },
    get isRunning(): boolean {
      return started;
    },
  };
}

export type SSEClient = ReturnType<typeof createSSEClient>;
