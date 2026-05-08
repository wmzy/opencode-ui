import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Session } from '@/types/session';
import { Button } from '@/components/ui/button';
import { useSdk } from '@/context/sdk';

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

const contextUsageStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
`;

const contextBarStyle = css`
  width: 60px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
`;

const contextFillStyle = css`
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
`;

const actionsGroupStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
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
  onShare?: () => void;
  onArchive?: () => void;
  tokenUsage?: { input: number; output: number };
  maxTokens?: number;
  className?: string;
};

export function SessionHeader({
  session,
  onTitleChange,
  onShare,
  onArchive,
  tokenUsage,
  maxTokens = 200000,
  className,
}: SessionHeaderProps) {
  const { client } = useSdk();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
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
    setShareLoading(true);
    try {
      const result = (await client.session.share(session.id)) as { url: string };
      setShareUrl(result.url);
      setShareOpen(true);
    } catch {
      // share failure
    } finally {
      setShareLoading(false);
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

  const tokenPercent = tokenUsage
    ? Math.min(100, ((tokenUsage.input + tokenUsage.output) / maxTokens) * 100)
    : 0;

  const fillColor = tokenPercent > 80 ? 'var(--color-error)' : tokenPercent > 50 ? 'var(--color-warning)' : 'var(--color-success)';

  return (
    <div className={cx(headerStyle, className)}>
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
        <div className={contextUsageStyle}>
          <div className={contextBarStyle}>
            <div
              className={contextFillStyle}
              style={{ width: `${tokenPercent}%`, background: fillColor }}
            />
          </div>
          <span>{((tokenUsage.input + tokenUsage.output) / 1000).toFixed(1)}k</span>
        </div>
      )}
      <div className={actionsGroupStyle}>
        {session?.id && (
          <div className={shareBtnWrapper} ref={shareRef}>
            <Button variant="ghost" size="sm" onClick={handleShare} loading={shareLoading}>
              🔗
            </Button>
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
        {onShare && (
          <Button variant="ghost" size="sm" onClick={onShare}>
            Share
          </Button>
        )}
        {onArchive && (
          <Button variant="ghost" size="sm" onClick={onArchive}>
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}
