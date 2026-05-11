import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ModelSelectorPopover } from './model-selector-popover';
import type { FlatModel } from '@/hooks/use-providers';

const composerStyle = css`
  flex-shrink: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + var(--safe-area-bottom));
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);

  @media (max-width: 768px) {
    padding: 8px 12px;
    padding-bottom: calc(8px + var(--safe-area-bottom));
  }
`;

const inputRowStyle = css`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 800px;
  margin: 0 auto;
`;

const textareaWrapperStyle = css`
  flex: 1;
  position: relative;
  min-width: 0;
`;

const textareaStyle = css`
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: 10px 14px;
  padding-right: 40px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  overflow-y: auto;

  &:focus {
    border-color: var(--color-accent);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const stopBtnStyle = css`
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  transition: all 0.15s;

  &:hover {
    background: var(--color-error);
    color: white;
    border-color: var(--color-error);
  }
`;

const sendBtnStyle = css`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: white;
  border-radius: 12px;
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: background 0.2s;
  border: none;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: var(--color-accent-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const toolbarStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const toolbarBtnStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  max-width: 200px;
  white-space: nowrap;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border-color: var(--color-border);
  }
`;

const toolbarBtnActiveStyle = css`
  color: var(--color-text-secondary);
  border-color: var(--color-border);
  background: var(--color-bg-tertiary);
`;

const toolbarBtnLabelStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const toolbarBtnChevronStyle = css`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.5;
`;

const agentSelectStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 26px;
  padding: 2px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  max-width: 160px;
  text-transform: capitalize;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border-color: var(--color-border);
  }
`;

const agentPopupStyle = css`
  position: fixed;
  z-index: 1100;
  min-width: 120px;
  padding: 4px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
`;

const agentPopupItemStyle = css`
  padding: 6px 10px;
  font-size: 12px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 4px;
  text-transform: capitalize;
  transition: background-color 0.1s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const agentPopupActiveStyle = css`
  color: var(--color-accent);
  font-weight: 500;
`;

const spacerStyle = css`
  flex: 1;
`;

const hintStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.7;
  white-space: nowrap;
`;

const attachBtnStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border-color: var(--color-border);
  }
`;

export type SessionComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  agents: { name: string; mode: string; hidden?: boolean }[];
  currentAgent?: string;
  onAgentChange: (agent: string) => void;
  models: FlatModel[];
  currentModel?: { providerID: string; modelID: string };
  onModelChange: (model: { providerID: string; modelID: string } | undefined) => void;
  reasoningEffort?: 'low' | 'medium' | 'high';
  onReasoningEffortChange: (effort: 'low' | 'medium' | 'high' | undefined) => void;
  onAttachFile?: () => void;
  modelSelectorTriggerRef?: React.RefObject<HTMLButtonElement | null>;
};

export function SessionComposer({
  value,
  onChange,
  onSend,
  onStop,
  streaming = false,
  disabled = false,
  placeholder = 'Send a message...',
  className,
  agents,
  currentAgent,
  onAgentChange,
  models,
  currentModel,
  onModelChange,
  reasoningEffort,
  onReasoningEffortChange,
  onAttachFile,
  modelSelectorTriggerRef,
}: SessionComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentTriggerRef = useRef<HTMLButtonElement>(null);
  const agentPopupRef = useRef<HTMLDivElement>(null);
  const [composing, setComposing] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [modelAnchorRect, setModelAnchorRect] = useState<DOMRect>();
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentAnchorRect, setAgentAnchorRect] = useState<DOMRect>();

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const visibleAgents = useMemo(
    () => agents.filter((a) => a.mode !== 'subagent' && !a.hidden),
    [agents],
  );

  useEffect(() => {
    if (!agentOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (agentTriggerRef.current?.contains(target)) return;
      if (agentPopupRef.current?.contains(target)) return;
      setAgentOpen(false);
    };
    const timer = setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handler);
    };
  }, [agentOpen]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (composing) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !disabled && !streaming) {
          onSend();
        }
      }
    },
    [composing, value, disabled, streaming, onSend],
  );

  const handleCompositionStart = useCallback(() => setComposing(true), []);
  const handleCompositionEnd = useCallback(() => setComposing(false), []);

  const canSend = value.trim().length > 0 && !disabled && !streaming;

  const handleModelToggle = useCallback(() => {
    if (modelSelectorTriggerRef?.current) {
      setModelAnchorRect(modelSelectorTriggerRef.current.getBoundingClientRect());
    }
    setModelOpen((prev) => !prev);
  }, [modelSelectorTriggerRef]);

  const handleAgentToggle = useCallback(() => {
    if (agentTriggerRef.current) {
      setAgentAnchorRect(agentTriggerRef.current.getBoundingClientRect());
    }
    setAgentOpen((prev) => !prev);
  }, []);

  const handleAgentSelect = useCallback(
    (name: string) => {
      onAgentChange(name);
      setAgentOpen(false);
    },
    [onAgentChange],
  );

  const handleReasoningEffortToggle = useCallback(() => {
    if (!reasoningEffort) {
      onReasoningEffortChange('medium');
    } else if (reasoningEffort === 'low') {
      onReasoningEffortChange(undefined);
    } else if (reasoningEffort === 'medium') {
      onReasoningEffortChange('high');
    } else {
      onReasoningEffortChange('low');
    }
  }, [reasoningEffort, onReasoningEffortChange]);

  const currentModelName = currentModel
    ? models.find(
      (m) => m.provider.id === currentModel.providerID && m.id === currentModel.modelID,
    )?.name ?? currentModel.modelID
    : undefined;

  const currentModelSupportsReasoning = currentModel
    ? models.find(
      (m) => m.provider.id === currentModel.providerID && m.id === currentModel.modelID,
    )?.capabilities.reasoning === true
    : false;

  const reasoningEffortLabel: Record<'low' | 'medium' | 'high', string> = {
    low: 'Low',
    medium: 'Med',
    high: 'High',
  };

  return (
    <div className={cx(composerStyle, className)}>
      <div className={inputRowStyle}>
        <div className={textareaWrapperStyle}>
          <textarea
            ref={textareaRef}
            className={textareaStyle}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
          />
          {streaming && onStop && (
            <button className={stopBtnStyle} onClick={onStop} aria-label="Stop generation">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="10" height="10" rx="2" />
              </svg>
            </button>
          )}
        </div>
        {!streaming && (
          <button
            className={sendBtnStyle}
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
          >
            ↑
          </button>
        )}
      </div>
      <div className={toolbarStyle}>
        {visibleAgents.length > 0 && (
          <>
            <button
              ref={agentTriggerRef}
              className={agentSelectStyle}
              onClick={handleAgentToggle}
              aria-label="Select agent"
            >
              {currentAgent ?? visibleAgents[0]?.name ?? 'Agent'}
              <span className={toolbarBtnChevronStyle}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7L1 3h8z" />
                </svg>
              </span>
            </button>
            {agentOpen && (
              <div
                ref={agentPopupRef}
                className={agentPopupStyle}
                style={{
                  position: 'fixed',
                  bottom: agentAnchorRect ? window.innerHeight - agentAnchorRect.top + 4 : undefined,
                  left: agentAnchorRect?.left,
                  zIndex: 1100,
                }}
              >
                {visibleAgents.map((a) => (
                  <div
                    key={a.name}
                    className={cx(agentPopupItemStyle, a.name === currentAgent && agentPopupActiveStyle)}
                    onClick={() => handleAgentSelect(a.name)}
                  >
                    {a.name}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {models.length > 0 && (
          <button
            ref={modelSelectorTriggerRef}
            className={cx(toolbarBtnStyle, currentModelName && toolbarBtnActiveStyle)}
            onClick={handleModelToggle}
            aria-label="Select model"
          >
            <span className={toolbarBtnLabelStyle}>
              {currentModelName ?? 'Select model'}
            </span>
            <span className={toolbarBtnChevronStyle}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M5 7L1 3h8z" />
              </svg>
            </span>
          </button>
        )}
        {currentModelSupportsReasoning && (
          <button
            className={cx(toolbarBtnStyle, reasoningEffort && toolbarBtnActiveStyle)}
            onClick={handleReasoningEffortToggle}
            aria-label="Reasoning effort"
            title={`Thinking depth: ${reasoningEffort ?? 'off'}`}
          >
            <span className={toolbarBtnLabelStyle}>
              💭 {reasoningEffort ? reasoningEffortLabel[reasoningEffort] : 'Off'}
            </span>
          </button>
        )}
        {onAttachFile && (
          <button
            className={attachBtnStyle}
            onClick={onAttachFile}
            aria-label="Attach file"
            title="Attach file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
        )}
        <span className={spacerStyle} />
        <span className={hintStyle}>
          <kbd style={{ fontSize: '10px', padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', border: '1px solid var(--color-border)' }}>Enter</kbd> to send
        </span>
      </div>
      {modelOpen && (
        <ModelSelectorPopover
          models={models}
          currentModel={currentModel}
          onSelect={onModelChange}
          onClose={() => setModelOpen(false)}
          anchorRect={modelAnchorRect}
        />
      )}
    </div>
  );
}
