import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Session } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useSdk } from '@/context/sdk';
import { StatusPopover } from './status-popover';

const headerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  min-height: 44px;

  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

const titleInputStyle = css`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:focus {
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    padding: 2px 6px;
    margin: -2px -6px;
  }
`;

const titleDisplayStyle = css`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
  min-width: 0;
`;

const contextBtnStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  position: relative;
`;

const contextPopoverStyle = css`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  padding: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const contextStatRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
`;

const contextStatLabelStyle = css`
  color: var(--color-text-tertiary);
`;

const contextStatValueStyle = css`
  color: var(--color-text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

const actionsGroupStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const hamburgerBtnStyle = css`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--color-text-secondary);

    &:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text);
    }
  }
`;

const toggleBtnStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.15s;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: none;
  border: none;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const toggleBtnActiveStyle = css`
  background: var(--color-bg-tertiary);
`;

const modelInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 2px 6px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
`;

const modelDotStyle = css`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
`;

const sharePopoverStyle = css`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 260px;
`;

const shareUrlStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const shareUrlInputStyle = css`
  flex: 1;
  padding: 4px 8px;
  font-size: 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-family: monospace;
  outline: none;
  min-width: 0;
`;

const shareUrlLabel = css`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
`;

const shareActionsStyle = css`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const shareBtnWrapper = css`
  position: relative;
`;

export type SessionHeaderProps = {
  session?: Session;
  onTitleChange?: (title: string) => void;
  tokenUsage?: { input: number; output: number; reasoning: number; cacheRead: number; cacheWrite: number } | null;
  maxTokens?: number;
  sidePanelOpen?: boolean;
  terminalOpen?: boolean;
  onToggleSidePanel?: () => void;
  onToggleTerminal?: () => void;
  onToggleSidebar?: () => void;
  modelId?: string;
  className?: string;
};

export function SessionHeader({
  session,
  onTitleChange,
  tokenUsage,
  maxTokens = 200000,
  sidePanelOpen = false,
  terminalOpen = false,
  onToggleSidePanel,
  onToggleTerminal,
  onToggleSidebar,
  modelId,
  className,
}: SessionHeaderProps) {
  const { client } = useSdk();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const title = session?.title ?? 'New session';
  const existingShareUrl = session?.share?.url ?? null;

  useEffect(() => {
    if (existingShareUrl) {
      setShareUrl(existingShareUrl);
    }
  }, [existingShareUrl]);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareOpen]);

  const startEditing = useCallback(() => {
    setDraft(title);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [title]);

  const saveTitle = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title && onTitleChange) {
      onTitleChange(trimmed);
    }
    setEditing(false);
  }, [draft, title, onTitleChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTitle();
      } else if (e.key === 'Escape') {
        setEditing(false);
      }
    },
    [saveTitle],
  );

  const handleShare = useCallback(async () => {
    if (!session?.id) return;
    if (shareUrl) {
      setShareOpen((prev) => !prev);
      return;
    }
    try {
      const result = (await client.session.share(session.id)) as { url: string };
      setShareUrl(result.url);
      setShareOpen(true);
    } catch {
      // share failure
    }
  }, [session?.id, client, shareUrl]);

  const handleUnshare = useCallback(async () => {
    if (!session?.id) return;
    try {
      await client.session.unshare(session.id);
      setShareUrl(null);
      setShareOpen(false);
    } catch {
      // unshare failure
    }
  }, [session?.id, client]);

  const handleCopy = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const tokenTotal = tokenUsage ? tokenUsage.input + tokenUsage.output + tokenUsage.reasoning + tokenUsage.cacheRead + tokenUsage.cacheWrite : 0;
  const tokenPercent = tokenUsage && maxTokens > 0
    ? Math.min(100, (tokenTotal / maxTokens) * 100)
    : 0;

  const fillColor = tokenPercent > 80 ? 'var(--color-error)' : tokenPercent > 50 ? 'var(--color-warning)' : 'var(--color-success)';

  const [contextOpen, setContextOpen] = useState(false);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextOpen]);

  return (
    <div className={cx(headerStyle, className)}>
      {onToggleSidebar && (
        <button
          className={hamburgerBtnStyle}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="4" x2="14" y2="4" />
            <line x1="2" y1="8" x2="14" y2="8" />
            <line x1="2" y1="12" x2="14" y2="12" />
          </svg>
        </button>
      )}
      {editing ? (
        <input
          ref={inputRef}
          className={titleInputStyle}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className={titleDisplayStyle} onDoubleClick={startEditing}>
          {title}
        </div>
      )}
      {tokenUsage && (
        <div ref={contextRef} style={{ position: 'relative' }}>
          <Tooltip
            content={(
              <>
                <div>{(tokenTotal / 1000).toFixed(1)}k tokens</div>
                <div>{Math.round(tokenPercent)}% usage</div>
              </>
            )}
          >
            <button
              className={contextBtnStyle}
              onClick={() => setContextOpen((prev) => !prev)}
              aria-label="Context usage"
              type="button"
            >
              <CircularProgress percentage={tokenPercent} size={16} strokeWidth={2.5} color={fillColor} />
            </button>
          </Tooltip>
          {contextOpen && (
            <div className={contextPopoverStyle}>
              <div className={contextStatRowStyle}>
                <span className={contextStatLabelStyle}>Total</span>
                <span className={contextStatValueStyle}>{(tokenTotal / 1000).toFixed(1)}k</span>
              </div>
              <div className={contextStatRowStyle}>
                <span className={contextStatLabelStyle}>Input</span>
                <span className={contextStatValueStyle}>{(tokenUsage.input / 1000).toFixed(1)}k</span>
              </div>
              <div className={contextStatRowStyle}>
                <span className={contextStatLabelStyle}>Output</span>
                <span className={contextStatValueStyle}>{(tokenUsage.output / 1000).toFixed(1)}k</span>
              </div>
              {tokenUsage.reasoning > 0 && (
                <div className={contextStatRowStyle}>
                  <span className={contextStatLabelStyle}>Reasoning</span>
                  <span className={contextStatValueStyle}>{(tokenUsage.reasoning / 1000).toFixed(1)}k</span>
                </div>
              )}
              {(tokenUsage.cacheRead > 0 || tokenUsage.cacheWrite > 0) && (
                <div className={contextStatRowStyle}>
                  <span className={contextStatLabelStyle}>Cache</span>
                  <span className={contextStatValueStyle}>{(tokenUsage.cacheRead / 1000).toFixed(1)}k / {(tokenUsage.cacheWrite / 1000).toFixed(1)}k</span>
                </div>
              )}
              <div className={contextStatRowStyle}>
                <span className={contextStatLabelStyle}>Usage</span>
                <span className={contextStatValueStyle}>{Math.round(tokenPercent)}%</span>
              </div>
              <div className={contextStatRowStyle}>
                <span className={contextStatLabelStyle}>Limit</span>
                <span className={contextStatValueStyle}>{(maxTokens / 1000).toFixed(0)}k</span>
              </div>
            </div>
          )}
        </div>
      )}
      {modelId && (
        <div className={modelInfoStyle}>
          <div className={modelDotStyle} />
          <span>{modelId}</span>
        </div>
      )}
      <div className={actionsGroupStyle}>
        <StatusPopover />
        {onToggleTerminal && (
          <button
            className={cx(toggleBtnStyle, terminalOpen && toggleBtnActiveStyle)}
            onClick={onToggleTerminal}
            aria-label="Toggle terminal"
            aria-pressed={terminalOpen}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4,4 7,8 4,12" />
              <line x1="9" y1="12" x2="13" y2="12" />
              <rect x="1" y="1" width="14" height="14" rx="2" />
            </svg>
          </button>
        )}
        {onToggleSidePanel && (
          <button
            className={cx(toggleBtnStyle, sidePanelOpen && toggleBtnActiveStyle)}
            onClick={onToggleSidePanel}
            aria-label="Toggle file tree"
            aria-pressed={sidePanelOpen}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="6" height="14" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
        )}
        {session?.id && (
          <div className={shareBtnWrapper} ref={shareRef}>
            <button
              className={toggleBtnStyle}
              onClick={handleShare}
              aria-label="Share session"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
                <path d="M4 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0" transform="translate(-2,0)" />
                <path d="M2 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0" transform="translate(6,0)" />
              </svg>
            </button>
            {shareOpen && shareUrl && (
              <div className={sharePopoverStyle}>
                <div className={shareUrlLabel}>Share link</div>
                <div className={shareUrlStyle}>
                  <input
                    className={shareUrlInputStyle}
                    value={shareUrl}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                  <Button size="sm" onClick={handleCopy}>
                    {copied ? '✓' : 'Copy'}
                  </Button>
                </div>
                <div className={shareActionsStyle}>
                  <Button size="sm" variant="danger" onClick={handleUnshare}>
                    Unshare
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
