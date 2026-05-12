import { css } from '@linaria/core';
import { useParams, useOutletContext } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useI18n } from '@/context/language';
import { useSdk } from '@/context/sdk';
import { usePrompt } from '@/context/prompt';
import { useCommands } from '@/context/command';
import { useNotification } from '@/context/notification';
import type { Message, MessageWithParts } from '@/types/message';
import type { Part } from '@/types/part';
import { SessionHeader } from '@/components/session/session-header';
import { MessageTimeline } from '@/components/session/message-timeline';
import { SessionComposer } from '@/components/session/session-composer';
import { SessionSidePanel } from '@/components/session/session-side-panel';
import { SessionPermissionDock } from '@/components/session/session-permission-dock';
import { SessionQuestionDock } from '@/components/session/session-question-dock';
import { SessionTodoDock } from '@/components/session/session-todo-dock';
import { TerminalPanel } from '@/components/terminal/terminal-panel';
import { Spinner } from '@/components/ui/spinner';
import { useAgents } from '@/hooks/use-agents';
import { useProviders } from '@/hooks/use-providers';

const sessionContainer = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const loadingOverlay = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-tertiary);
`;

const emptyState = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
`;

const emptyIcon = css`
  font-size: 4rem;
  opacity: 0.4;
`;

const emptyTitle = css`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
`;

const emptySubtitle = css`
  font-size: 0.9rem;
  color: var(--color-text-tertiary);
  max-width: 420px;
  line-height: 1.6;
`;

const errorBanner = css`
  padding: 10px 16px;
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
  color: var(--color-error);
  font-size: 13px;
`;

const sessionBodyStyle = css`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
`;

const messageAreaStyle = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export function SessionPage() {
  const { id, dir } = useParams<{ id?: string; dir?: string }>();
  const { t } = useI18n();
  const { getSdk } = useSdk();
  const prompt = usePrompt();
  const { onToggleSidebar } = useOutletContext<{ activeSessionId?: string; onToggleSidebar?: () => void }>();
  const notification = useNotification();

  const directory = useMemo(() => {
    try {
      return dir ? atob(dir) : undefined;
    } catch {
      return dir;
    }
  }, [dir]);

  const sdk = useMemo(
    () => getSdk(directory ?? ''),
    [getSdk, directory],
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [partsByMessage, setPartsByMessage] = useState<Map<string, Part[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const { registerCommand } = useCommands();
  const { agents } = useAgents(sdk);
  const { models, defaultModel } = useProviders(sdk);
  const modelSelectorTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!id) return;
    notification.session.markViewed(id);
  }, [id, notification.session]);

  useEffect(() => {
    const visible = agents.filter((a) => a.mode !== 'subagent' && !a.hidden);
    if (visible.length > 0 && !prompt.state.agent) {
      const primary = visible.find((a) => a.mode === 'primary') ?? visible[0];
      if (primary) prompt.setAgent(primary.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init-only: set default agent once
  }, [agents.length, prompt.state.agent]);

  useEffect(() => {
    if (models.length > 0 && !prompt.state.model && defaultModel) {
      prompt.setModel(defaultModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init-only: set default model once
  }, [models.length, prompt.state.model, defaultModel]);

  useEffect(() => {
    const unregisters: (() => void)[] = [];

    unregisters.push(registerCommand({
      id: 'session.undo',
      label: 'Undo Last Message',
      group: 'Session',
      action: async () => { if (!id) return; },
    }));

    unregisters.push(registerCommand({
      id: 'session.share',
      label: 'Share Session',
      group: 'Session',
      action: async () => {
        if (!id) return;
        try {
          const result = await sdk.session.share(id);
          if (typeof result === 'string') {
            await navigator.clipboard.writeText(result);
          }
        } catch {
          // ignore clipboard failure
        }
      },
    }));

    unregisters.push(registerCommand({
      id: 'model.choose',
      label: 'Choose Model',
      group: 'Model',
      shortcut: 'mod+\'',
      action: () => { modelSelectorTriggerRef.current?.click(); },
    }));

    unregisters.push(registerCommand({
      id: 'agent.cycle',
      label: 'Cycle Agent',
      group: 'Model',
      shortcut: 'mod+.',
      action: () => {
        const visible = agents.filter((a) => a.mode !== 'subagent' && !a.hidden);
        if (visible.length === 0) return;
        const current = prompt.state.agent ?? '';
        const idx = visible.findIndex((a) => a.name === current);
        const next = visible[(idx + 1) % visible.length];
        prompt.setAgent(next.name);
      },
    }));

    unregisters.push(registerCommand({
      id: 'terminal.toggle',
      label: 'Toggle Terminal',
      group: 'Terminal',
      shortcut: 'ctrl+`',
      action: () => { setTerminalOpen(prev => !prev); },
    }));

    unregisters.push(registerCommand({
      id: 'terminal.new',
      label: 'New Terminal',
      group: 'Terminal',
      shortcut: 'ctrl+alt+t',
      action: () => { setTerminalOpen(true); },
    }));

    return () => unregisters.forEach(fn => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- command registration: stable on id/sdk change
  }, [id, sdk, registerCommand]);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    sdk.session.message
      .list(id, { signal: controller.signal, limit: 55 })
      .then((data) => {
        if (controller.signal.aborted) return;
        const items = (data ?? []) as MessageWithParts[];
        const msgList = items.map(item => item.info).filter((m): m is Message => !!m?.id);
        const partsMap = new Map<string, Part[]>();
        for (const item of items) {
          if (item.info?.id) {
            partsMap.set(item.info.id, item.parts ?? []);
          }
        }
        msgList.sort((a, b) => {
          if (a.time?.created !== b.time?.created) return (a.time?.created ?? 0) - (b.time?.created ?? 0);
          return a.id.localeCompare(b.id);
        });
        setMessages(msgList);
        setPartsByMessage(partsMap);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load messages');
        setLoading(false);
      });

    sdk.session
      .get(id, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setSessionData(data);
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [id, sdk]);

  const handleSend = useCallback(async () => {
    if (!id) return;
    const text = prompt.getText();
    if (!text.trim()) return;

    prompt.setText('');
    setError(null);

    try {
      await prompt.send(id, sdk);
      const data = (await sdk.session.message.list(id, { limit: 55 })) as MessageWithParts[];
      const msgList = data.map(item => item.info).filter((m): m is Message => !!m?.id);
      const partsMap = new Map<string, Part[]>();
      for (const item of data) {
        if (item.info?.id) {
          partsMap.set(item.info.id, item.parts ?? []);
        }
      }
      msgList.sort((a, b) => {
        if (a.time?.created !== b.time?.created) return (a.time?.created ?? 0) - (b.time?.created ?? 0);
        return a.id.localeCompare(b.id);
      });
      setMessages(msgList);
      setPartsByMessage(partsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [id, sdk, prompt]);

  const handleStop = useCallback(async () => {
    if (!id) return;
    await prompt.abort(id, sdk);
  }, [id, sdk, prompt]);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (!id) return;
    try {
      await sdk.session.update(id, { body: { title: newTitle } });
    } catch {
      // ignore title update failure
    }
  }, [id, sdk]);

  const handleAttachFile = useCallback(() => {
    // eslint-disable-next-line no-alert -- file path input via prompt dialog
    const path = window.prompt('Enter file path to attach:');
    if (!path?.trim()) return;
    prompt.addPart({
      type: 'file',
      url: path.startsWith('file://') ? path : `file://${path}`,
      mime: 'text/plain',
      filename: path.split('/').pop() ?? path,
    });
  }, [prompt]);

  const isStreaming = prompt.state.streaming;

  const tokenUsage = useMemo(() => {
    const last = [...messages].reverse().find((m): m is import('@/types/message').AssistantMessage => m.role === 'assistant');
    if (!last?.tokens) return null;
    const { input, output, reasoning, cache } = last.tokens;
    return { input, output, reasoning, cacheRead: cache.read, cacheWrite: cache.write };
  }, [messages]);

  if (!id) {
    return (
      <div className={sessionContainer}>
        <SessionHeader onToggleSidebar={onToggleSidebar} />
        <div className={emptyState}>
          <div className={emptyIcon}>💬</div>
          <div className={emptyTitle}>{t('session.new')}</div>
          <div className={emptySubtitle}>
            Start a conversation with the AI assistant. Send a message to begin.
          </div>
        </div>
        <SessionComposer
          value={prompt.getText()}
          onChange={prompt.setText}
          onSend={handleSend}
          streaming={isStreaming}
          placeholder={t('session.placeholder')}
          agents={agents}
          currentAgent={prompt.state.agent}
          onAgentChange={prompt.setAgent}
          models={models}
          currentModel={prompt.state.model}
          onModelChange={prompt.setModel}
          reasoningEffort={prompt.state.reasoningEffort}
          onReasoningEffortChange={prompt.setReasoningEffort}
          onAttachFile={handleAttachFile}
          modelSelectorTriggerRef={modelSelectorTriggerRef}
        />
      </div>
    );
  }

  return (
    <div className={sessionContainer}>
      <SessionHeader
        session={sessionData as import('@/types/session').Session | undefined}
        onTitleChange={handleTitleChange}
        tokenUsage={tokenUsage}
        sidePanelOpen={sidePanelOpen}
        terminalOpen={terminalOpen}
        onToggleSidePanel={() => setSidePanelOpen(prev => !prev)}
        onToggleTerminal={() => setTerminalOpen(prev => !prev)}
        onToggleSidebar={onToggleSidebar}
      />
      {error && <div className={errorBanner}>{error}</div>}
      <div className={sessionBodyStyle}>
        <div className={messageAreaStyle}>
          {loading ? (
            <div className={loadingOverlay}>
              <Spinner size="lg" color="muted" />
              <span>Loading messages...</span>
            </div>
          ) : (
            <MessageTimeline
              messages={messages}
              partsByMessage={partsByMessage}
              streamingMessageID={isStreaming ? 'streaming' : undefined}
            />
          )}
        </div>
        {sidePanelOpen && (
          <SessionSidePanel
            onClose={() => setSidePanelOpen(false)}
            messages={messages}
            partsByMessage={partsByMessage}
            session={sessionData as import('@/types/session').Session | undefined}
            sessionID={id}
          />
        )}
      </div>
      <SessionTodoDock sessionId={id} />
      <SessionPermissionDock sessionId={id} />
      <SessionQuestionDock sessionId={id} />
      <SessionComposer
        value={prompt.getText()}
        onChange={prompt.setText}
        onSend={handleSend}
        onStop={handleStop}
        streaming={isStreaming}
        placeholder={t('session.placeholder')}
        agents={agents}
        currentAgent={prompt.state.agent}
        onAgentChange={prompt.setAgent}
        models={models}
        currentModel={prompt.state.model}
        onModelChange={prompt.setModel}
        reasoningEffort={prompt.state.reasoningEffort}
        onReasoningEffortChange={prompt.setReasoningEffort}
        onAttachFile={handleAttachFile}
        modelSelectorTriggerRef={modelSelectorTriggerRef}
      />
      {terminalOpen && (
        <TerminalPanel
          height={terminalHeight}
          onHeightChange={setTerminalHeight}
          directory={directory}
          onClose={() => setTerminalOpen(false)}
        />
      )}
    </div>
  );
}
