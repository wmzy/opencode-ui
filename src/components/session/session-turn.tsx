import { css, cx } from '@linaria/core';
import { useMemo, useCallback, useState } from 'react';
import type { Message, UserMessage, AssistantMessage } from '@/types/message';
import type { Part, TextPart, ToolPart, ReasoningPart, FilePart, StepStartPart, StepFinishPart } from '@/types/part';
import { MessageText } from './message-text';
import { MessageToolCall } from './message-tool-call';
import { MessageReasoning } from './message-reasoning';
import { MessageStep } from './message-step';
import { MessageFiles } from './message-files';
import { Spinner } from '@/components/ui/spinner';

const turnStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`;

const userTurnStyle = css`
  align-items: flex-end;
`;

const assistantTurnStyle = css`
  align-items: flex-start;
`;

const avatarStyle = css`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
`;

const userAvatarStyle = css`
  background: var(--color-accent);
  color: white;
  font-weight: 600;
`;

const assistantAvatarStyle = css`
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
`;

const messageContentStyle = css`
  max-width: 85%;
  min-width: 0;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
`;

const userContentStyle = css`
  background: var(--color-accent);
  color: white;
  border-bottom-right-radius: 4px;

  & a {
    color: white;
    text-decoration: underline;
  }
`;

const assistantContentStyle = css`
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 4px;
`;

const metaStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 0 4px;
`;

const actionsStyle = css`
  display: flex;
  gap: 4px;
  margin-top: 6px;
`;

const actionBtnStyle = css`
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  border: none;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: var(--color-text-secondary);
    background: var(--color-border);
  }
`;

const partsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const thinkingStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-style: italic;
`;

const interruptedStyle = css`
  font-size: 12px;
  color: var(--color-warning);
  padding: 4px 0;
`;

const errorStyle = css`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
  color: var(--color-error);
  font-size: 13px;
  word-break: break-word;
`;

type UserActions = {
  fork?: (input: { sessionID: string; messageID: string }) => Promise<void> | void;
  revert?: (input: { sessionID: string; messageID: string }) => Promise<void> | void;
};

export type SessionTurnProps = {
  message: Message;
  parts: Part[];
  assistantMessages?: AssistantMessage[];
  assistantParts?: Map<string, Part[]>;
  actions?: UserActions;
  isStreaming?: boolean;
  className?: string;
};

function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function groupSteps(parts: Part[]): Array<Part | { type: 'step-group'; start: StepStartPart; finish?: StepFinishPart }> {
  const result: Array<Part | { type: 'step-group'; start: StepStartPart; finish?: StepFinishPart }> = [];
  const stepStarts = new Map<string, StepStartPart>();
  const stepFinishes = new Map<string, StepFinishPart>();

  for (const part of parts) {
    if (part.type === 'step-start') {
      stepStarts.set(part.snapshot ?? part.id, part);
    } else if (part.type === 'step-finish') {
      stepFinishes.set(part.snapshot ?? part.id, part);
    }
  }

  const matched = new Set<string>();
  for (const [key, start] of stepStarts) {
    const finish = stepFinishes.get(key);
    result.push({ type: 'step-group', start, finish });
    matched.add(key);
  }

  for (const part of parts) {
    if (part.type === 'step-start') {
      const key = part.snapshot ?? part.id;
      if (matched.has(key)) continue;
      result.push({ type: 'step-group', start: part });
    } else if (part.type === 'step-finish') {
      const key = part.snapshot ?? part.id;
      if (matched.has(key)) continue;
      result.push(part);
    } else {
      result.push(part);
    }
  }

  return result;
}

function PartRenderer({ part, streaming }: { part: Part; streaming: boolean }) {
  switch (part.type) {
    case 'text':
      return <MessageText part={part as TextPart} streaming={streaming} />;
    case 'tool':
      return <MessageToolCall part={part as ToolPart} defaultOpen={part.tool === 'bash'} />;
    case 'reasoning':
      return <MessageReasoning part={part as ReasoningPart} streaming={streaming} />;
    case 'file':
      return null;
    default:
      return null;
  }
}

export function SessionTurn({
  message,
  parts,
  assistantMessages = [],
  assistantParts = new Map(),
  actions,
  isStreaming = false,
  className,
}: SessionTurnProps) {
  const isUser = message.role === 'user';

  const userTextPart = useMemo(
    () => parts.find((p): p is TextPart => p.type === 'text' && !p.synthetic) as TextPart | undefined,
    [parts],
  );

  const userFiles = useMemo(
    () => parts.filter((p): p is FilePart => p.type === 'file'),
    [parts],
  );

  const allAssistantParts = useMemo(() => {
    const result: Part[] = [];
    for (const msg of assistantMessages) {
      const msgParts = assistantParts.get(msg.id) ?? [];
      result.push(...msgParts);
    }
    return result;
  }, [assistantMessages, assistantParts]);

  const grouped = useMemo(() => groupSteps(allAssistantParts), [allAssistantParts]);

  const isInterrupted = assistantMessages.some(
    (m) => m.error?.name === 'MessageAbortedError',
  );
  const assistantError = assistantMessages.find(
    (m) => m.error && m.error.name !== 'MessageAbortedError',
  )?.error;

  const duration = useMemo(() => {
    if (isUser || assistantMessages.length === 0) return undefined;
    const start = message.time.created;
    const end = assistantMessages.reduce<number | undefined>((max, m) => {
      const c = m.time.completed;
      if (typeof c !== 'number') return max;
      return max === undefined ? c : Math.max(max, c);
    }, undefined);
    if (typeof end !== 'number' || end < start) return undefined;
    return end - start;
  }, [isUser, message.time.created, assistantMessages]);

  const hasAssistantContent = allAssistantParts.length > 0 || isStreaming;

  const handleRevert = useCallback(() => {
    actions?.revert?.({ sessionID: message.sessionID, messageID: message.id });
  }, [actions, message.sessionID, message.id]);

  const handleFork = useCallback(() => {
    actions?.fork?.({ sessionID: message.sessionID, messageID: message.id });
  }, [actions, message.sessionID, message.id]);

  if (isUser) {
    const userMsg = message as UserMessage;
    return (
      <div className={cx(turnStyle, userTurnStyle, className)}>
        <div className={cx(messageContentStyle, userContentStyle)}>
          {userTextPart?.text?.trim() && (
            <div style={{ whiteSpace: 'pre-wrap' }}>{userTextPart.text}</div>
          )}
          <MessageFiles files={userFiles} />
        </div>
        <div className={metaStyle}>
          <span>{userMsg.agent}</span>
          {userMsg.model && (
            <>
              <span>·</span>
              <span>{userMsg.model.modelID}</span>
            </>
          )}
          <span>·</span>
          <span>{new Date(userMsg.time.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {actions?.revert && (
          <div className={actionsStyle}>
            <button className={actionBtnStyle} onClick={handleRevert}>↩ Revert</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cx(turnStyle, assistantTurnStyle, className)}>
      {hasAssistantContent && (
        <div className={cx(messageContentStyle, assistantContentStyle)}>
          {isStreaming && allAssistantParts.length === 0 && (
            <div className={thinkingStyle}>
              <Spinner size="sm" color="muted" />
              <span>Thinking...</span>
            </div>
          )}
          <div className={partsStyle}>
            {grouped.map((item, i) => {
              if (typeof item === 'object' && 'type' in item && item.type === 'step-group') {
                return (
                  <MessageStep
                    key={`step-${i}`}
                    start={item.start}
                    finish={item.finish}
                  />
                );
              }
              const part = item as Part;
              if (part.type === 'text' && !(part as TextPart).text?.trim()) return null;
              return <PartRenderer key={part.id} part={part} streaming={isStreaming} />;
            })}
          </div>
          {isInterrupted && <div className={interruptedStyle}>Interrupted</div>}
          {assistantError && (
            <div className={errorStyle}>
              {typeof assistantError.data?.message === 'string' ? assistantError.data.message : 'An error occurred'}
            </div>
          )}
        </div>
      )}
      <div className={metaStyle}>
        {duration !== undefined && <span>{formatTime(duration)}</span>}
      </div>
    </div>
  );
}
