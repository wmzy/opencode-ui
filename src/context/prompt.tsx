import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { OpenCodeSdk } from '@/lib/sdk';
import type { PartInput } from '@/types/part';

const PERSIST_KEY = 'opencode-prompt';

type PromptPart = PartInput;

type FollowupItem = {
  id: string;
  parts: PromptPart[];
  model?: { providerID: string; modelID: string };
  agent?: string;
};

type PromptState = {
  parts: PromptPart[];
  model?: { providerID: string; modelID: string };
  agent?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  streaming: boolean;
  followups: FollowupItem[];
};

type PromptContextValue = {
  state: PromptState;
  setText: (text: string) => void;
  getText: () => string;
  addPart: (part: PromptPart) => void;
  removePart: (index: number) => void;
  clearParts: () => void;
  setModel: (model: { providerID: string; modelID: string } | undefined) => void;
  setAgent: (agent: string | undefined) => void;
  setReasoningEffort: (effort: 'low' | 'medium' | 'high' | undefined) => void;
  send: (sessionID: string, sdk: OpenCodeSdk) => Promise<void>;
  abort: (sessionID: string, sdk: OpenCodeSdk) => Promise<void>;
  queueFollowup: (item: Omit<FollowupItem, 'id'>) => void;
  dequeueFollowup: (id: string) => void;
  reset: () => void;
};

const PromptContext = createContext<PromptContextValue | null>(null);

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function textFromParts(parts: PromptPart[]): string {
  return parts
    .filter((p): p is Extract<PromptPart, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function loadPersisted(): Pick<PromptState, 'agent' | 'model'> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { agent: parsed.agent, model: parsed.model };
    }
  } catch {
    // ignore
  }
  return { agent: undefined, model: undefined };
}

function persist(fields: Pick<PromptState, 'agent' | 'model'>) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(fields));
  } catch {
    // ignore
  }
}

export function PromptProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PromptState>(() => {
    const saved = loadPersisted();
    return {
      parts: [],
      model: saved.model,
      agent: saved.agent,
      reasoningEffort: undefined,
      streaming: false,
      followups: [],
    };
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    persist({ agent: state.agent, model: state.model });
  }, [state.agent, state.model]);

  const setText = useCallback((text: string) => {
    setState((prev) => {
      const textIdx = prev.parts.findIndex((p) => p.type === 'text');
      const newParts = [...prev.parts];
      if (textIdx >= 0) {
        newParts[textIdx] = { ...newParts[textIdx], type: 'text', text };
      } else {
        newParts.unshift({ type: 'text', text });
      }
      return { ...prev, parts: newParts };
    });
  }, []);

  const getText = useCallback((): string => textFromParts(state.parts), [state.parts]);

  const addPart = useCallback((part: PromptPart) => {
    setState((prev) => ({ ...prev, parts: [...prev.parts, part] }));
  }, []);

  const removePart = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  }, []);

  const clearParts = useCallback(() => {
    setState((prev) => ({ ...prev, parts: [] }));
  }, []);

  const setModel = useCallback(
    (model: { providerID: string; modelID: string } | undefined) => {
      setState((prev) => ({ ...prev, model }));
    },
    [],
  );

  const setAgent = useCallback((agent: string | undefined) => {
    setState((prev) => ({ ...prev, agent }));
  }, []);

  const setReasoningEffort = useCallback((reasoningEffort: 'low' | 'medium' | 'high' | undefined) => {
    setState((prev) => ({ ...prev, reasoningEffort }));
  }, []);

  const send = useCallback(async (sessionID: string, sdk: OpenCodeSdk) => {
    const currentParts = state.parts;
    if (currentParts.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, streaming: true }));

    try {
      await sdk.session.message.create(sessionID, {
        body: {
          parts: currentParts,
          ...(state.model ? { model: state.model } : {}),
          ...(state.agent ? { agent: state.agent } : {}),
          ...(state.reasoningEffort ? { reasoningEffort: state.reasoningEffort } : {}),
        },
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    } finally {
      abortRef.current = null;
      setState((prev) => ({ ...prev, streaming: false }));
    }
  }, [state.parts, state.model, state.agent, state.reasoningEffort]);

  const abort = useCallback(async (sessionID: string, sdk: OpenCodeSdk) => {
    abortRef.current?.abort();
    try {
      await sdk.session.abort(sessionID);
    } catch {
      // ignore abort errors
    }
    setState((prev) => ({ ...prev, streaming: false }));
  }, []);

  const queueFollowup = useCallback((item: Omit<FollowupItem, 'id'>) => {
    const id = generateId();
    setState((prev) => ({
      ...prev,
      followups: [...prev.followups, { ...item, id }],
    }));
  }, []);

  const dequeueFollowup = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      followups: prev.followups.filter((f) => f.id !== id),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      parts: [],
      model: undefined,
      agent: undefined,
      reasoningEffort: undefined,
      streaming: false,
      followups: [],
    });
  }, []);

  return (
    <PromptContext.Provider
      value={{
        state,
        setText,
        getText,
        addPart,
        removePart,
        clearParts,
        setModel,
        setAgent,
        setReasoningEffort,
        send,
        abort,
        queueFollowup,
        dequeueFollowup,
        reset,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error('usePrompt must be used within PromptProvider');
  return ctx;
}
