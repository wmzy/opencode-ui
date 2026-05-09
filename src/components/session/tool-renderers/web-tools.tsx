import { css, cx } from '@linaria/core';
import { useState, useCallback } from 'react';
import type { ToolRendererProps } from '../tool-types';
import { MarkdownRenderer } from '../markdown-renderer';

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

const linkStyle = css`
  color: var(--color-accent);
  text-decoration: none;
  font-size: 12px;

  &:hover {
    text-decoration: underline;
  }
`;

export function WebFetchToolRenderer({ input, output, status, error, defaultOpen = false }: ToolRendererProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isPending = status === 'pending' || status === 'running';

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const url = typeof input.url === 'string' ? input.url : '';
  const subtitle = isPending ? 'Fetching...' : url;

  const statusIcon = (() => {
    if (isPending) return <span className={cx(iconStyle, iconRunning)}>🌐</span>;
    if (status === 'error') return <span className={cx(iconStyle, iconError)}>✕</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  return (
    <div className={wrapperStyle}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        {statusIcon}
        <span className={toolNameStyle}>WebFetch</span>
        <span className={subtitleStyle}>{subtitle}</span>
        {!isPending && url && (
          <a
            className={linkStyle}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        )}
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        {output && <MarkdownRenderer text={output} />}
      </div>
    </div>
  );
}

export function WebSearchToolRenderer({ input, output, status, error, defaultOpen = false }: ToolRendererProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isPending = status === 'pending' || status === 'running';

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const query = typeof input.query === 'string' ? input.query : '';
  const subtitle = isPending ? 'Searching...' : query;

  const statusIcon = (() => {
    if (isPending) return <span className={cx(iconStyle, iconRunning)}>🌐</span>;
    if (status === 'error') return <span className={cx(iconStyle, iconError)}>✕</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  const urls = output
    ? [...output.matchAll(/https?:\/\/[^\s<>"'`)\]]+/g)].map((m) => m[0].replace(/[),.;:!?]+$/, ''))
    : [];

  return (
    <div className={wrapperStyle}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        {statusIcon}
        <span className={toolNameStyle}>WebSearch</span>
        <span className={subtitleStyle}>{subtitle}</span>
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        {urls.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {urls.map((url, i) => (
              <a
                key={i}
                className={linkStyle}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {url}
              </a>
            ))}
          </div>
        )}
        {output && <MarkdownRenderer text={output} />}
      </div>
    </div>
  );
}
