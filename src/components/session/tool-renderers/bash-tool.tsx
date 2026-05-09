import { css, cx } from '@linaria/core';
import { useState, useCallback, useMemo } from 'react';
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

const triggerLockedStyle = css`
  cursor: default;
  &:hover {
    background: var(--color-bg-secondary);
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

const commandBlockStyle = css`
  font-family: var(--haze-font-mono, monospace);
  background: var(--color-bg-tertiary);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
  position: relative;
`;

const outputBlockStyle = css`
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-secondary);
`;

const copyBtnStyle = css`
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 4px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: var(--color-text-secondary);
    background: var(--color-bg-tertiary);
  }
`;

const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(?:\x07|\x1b\\)|\r/g; // eslint-disable-line no-control-regex

function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

function truncateCommand(cmd: string, maxLen = 60): string {
  const firstLine = cmd.split('\n')[0] ?? '';
  if (firstLine.length <= maxLen) return firstLine;
  return `${firstLine.slice(0, maxLen)}...`;
}

export function BashToolRenderer({ input, metadata, output, status, error, defaultOpen = true }: ToolRendererProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const isPending = status === 'pending' || status === 'running';

  const command =
    typeof input.command === 'string' ? input.command
      : typeof metadata.command === 'string' ? metadata.command
        : '';

  const rawOutput = stripAnsi(output ?? (typeof metadata.output === 'string' ? metadata.output : '') ?? '');
  const fullText = useMemo(() => {
    return `$ ${command}${rawOutput ? `\n\n${rawOutput}` : ''}`;
  }, [command, rawOutput]);

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // ignore
    });
  }, [fullText]);

  const statusIcon = (() => {
    if (isPending) return <span className={cx(iconStyle, iconRunning)}>⌘</span>;
    if (status === 'error') return <span className={cx(iconStyle, iconError)}>✕</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  return (
    <div className={wrapperStyle}>
      <button
        className={cx(triggerStyle, isPending && triggerLockedStyle)}
        onClick={handleToggle}
        aria-expanded={open}
      >
        {statusIcon}
        <span className={toolNameStyle}>Shell</span>
        <span className={subtitleStyle}>{truncateCommand(command)}</span>
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      <div className={cx(contentStyle, !open && contentCollapsedStyle)} style={{ padding: 12 }}>
        <div className={commandBlockStyle}>
          <span>{`$ ${command}`}</span>
          {command && (
            <button className={copyBtnStyle} onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
        </div>
        {rawOutput && (
          <div className={outputBlockStyle}>{rawOutput}</div>
        )}
      </div>
    </div>
  );
}
