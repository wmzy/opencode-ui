import { css, cx } from '@linaria/core';
import { useState, useCallback } from 'react';
import type { ToolRendererProps } from '../tool-types';

const wrapperStyle = css`
  margin: 6px 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`;

const triggerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  border: none;
  font-family: inherit;
  font-size: 13px;
  color: var(--color-text);
  text-align: left;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const iconStyle = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 14px;
`;

const iconRunning = css`
  color: var(--color-accent);
`;

const iconCompleted = css`
  color: var(--color-success);
`;

const iconError = css`
  color: var(--color-error);
`;

const toolNameStyle = css`
  font-weight: 500;
  flex-shrink: 0;
`;

const subtitleStyle = css`
  color: var(--color-text-tertiary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-family: var(--haze-font-mono, monospace);
`;

const chevronStyle = css`
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
  font-size: 12px;
`;

const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

const contentStyle = css`
  border-top: 1px solid var(--color-border);
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
`;

const contentCollapsedStyle = css`
  display: none;
`;

const errorBoxStyle = css`
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  color: var(--color-error);
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);
  white-space: pre-wrap;
  word-break: break-word;
`;

const filePathMonospace = css`
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 8px;
`;

const contentPreviewStyle = css`
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  padding: 8px 12px;
  max-height: 250px;
  overflow-y: auto;
`;

const MAX_PREVIEW_LENGTH = 2000;

export function WriteToolRenderer({ input, status, error, defaultOpen = false }: ToolRendererProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isPending = status === 'pending' || status === 'running';

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const filePath = typeof input.filePath === 'string' ? input.filePath : '';
  const content = typeof input.content === 'string' ? input.content : '';
  const subtitle = isPending ? 'Writing...' : (filePath.split('/').pop() ?? filePath);

  const statusIcon = (() => {
    if (isPending) return <span className={cx(iconStyle, iconRunning)}>✏️</span>;
    if (status === 'error') return <span className={cx(iconStyle, iconError)}>✕</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  const truncatedContent = content.length > MAX_PREVIEW_LENGTH
    ? `${content.slice(0, MAX_PREVIEW_LENGTH)}\n... (truncated)`
    : content;

  return (
    <div className={wrapperStyle}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        {statusIcon}
        <span className={toolNameStyle}>Write</span>
        <span className={subtitleStyle}>{subtitle}</span>
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        {filePath && <div className={filePathMonospace}>{filePath}</div>}
        {truncatedContent && (
          <div className={contentPreviewStyle}>{truncatedContent}</div>
        )}
      </div>
    </div>
  );
}
