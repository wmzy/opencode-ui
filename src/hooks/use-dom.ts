import { useState, useEffect, useCallback, useRef } from 'react';

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState];
}

export function useKeyboard(targetKey: string, callback: () => void, modifiers: string[] = []) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keyMatch = e.key.toLowerCase() === targetKey.toLowerCase();
      const metaMatch = modifiers.includes('meta') ? e.metaKey || e.ctrlKey : true;
      const shiftMatch = modifiers.includes('shift') ? e.shiftKey : !e.shiftKey;
      const altMatch = modifiers.includes('alt') ? e.altKey : !e.altKey;

      if (keyMatch && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [targetKey, modifiers]);
}

export function useAutoScroll(dependencies: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = () => {
      const threshold = 50;
      setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
    };

    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [dependencies, isAtBottom, scrollToBottom]);

  return { scrollRef: ref, isAtBottom, scrollToBottom };
}

export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler]);
}

export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      callbackRef.current(entries[0]);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
