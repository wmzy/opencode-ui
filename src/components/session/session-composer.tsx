import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';

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

const bottomBarStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const modelLabelStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
`;

const hintStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.7;
`;

export type SessionComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  modelName?: string;
  className?: string;
};

export function SessionComposer({
  value,
  onChange,
  onSend,
  onStop,
  streaming = false,
  disabled = false,
  placeholder = 'Send a message...',
  modelName,
  className,
}: SessionComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [composing, setComposing] = useState(false);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

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
      <div className={bottomBarStyle}>
        {modelName && <span className={modelLabelStyle}>{modelName}</span>}
        {!modelName && <span />}
        <span className={hintStyle}>
          <kbd style={{ fontSize: '10px', padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', border: '1px solid var(--color-border)' }}>Enter</kbd> to send · <kbd style={{ fontSize: '10px', padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', border: '1px solid var(--color-border)' }}>Shift+Enter</kbd> for new line
        </span>
      </div>
    </div>
  );
}
