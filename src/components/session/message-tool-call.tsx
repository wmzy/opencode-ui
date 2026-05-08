import { css, cx } from '@linaria/core';
import { useState, useCallback } from 'react';
import type { ToolPart } from '@/types/part';
import { MarkdownRenderer } from './markdown-renderer';
import { FileViewer } from '@/components/file/file-viewer';
import { Spinner } from '@/components/ui/spinner';

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
  padding: 12px;
  border-top: 1px solid var(--color-border);
  max-height: 400px;
  overflow-y: auto;
`;

const contentCollapsedStyle = css`
  display: none;
`;

const errorStyle = css`
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  color: var(--color-error);
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);
  white-space: pre-wrap;
  word-break: break-word;
`;

const bashCommandStyle = css`
  font-family: var(--haze-font-mono, monospace);
  background: var(--color-bg-tertiary);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
`;

const filePathStyle = css`
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 4px;
`;

const fileViewerContainerStyle = css`
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
`;

const writeContentStyle = css`
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  color: var(--color-text-secondary);
`;

const editDetailsStyle = css`
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  color: var(--color-text-secondary);
`;

type StatusIconProps = {
  status: string;
};

function StatusIcon({ status }: StatusIconProps) {
  if (status === 'pending' || status === 'running') {
    return <span className={cx(iconStyle, iconRunning)}><Spinner size="sm" color="primary" /></span>;
  }
  if (status === 'error') {
    return <span className={cx(iconStyle, iconError)}>✕</span>;
  }
  return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
}

function getToolIcon(tool: string): string {
  const icons: Record<string, string> = {
    bash: '⌘',
    read: '📖',
    write: '✏️',
    edit: '✏️',
    glob: '🔍',
    grep: '🔍',
    webfetch: '🌐',
    websearch: '🌐',
    todowrite: '📋',
    list: '📁',
    task: '⚡',
    apply_patch: '🔧',
  };
  return icons[tool] ?? '⚙️';
}

function getToolSubtitle(tool: string, input: Record<string, unknown>): string {
  const desc = input.description;
  if (typeof desc === 'string' && desc) return desc;
  const filePath = input.filePath;
  if (typeof filePath === 'string' && filePath) return filePath.split('/').pop() ?? filePath;
  const pattern = input.pattern;
  if (typeof pattern === 'string') return pattern;
  const url = input.url;
  if (typeof url === 'string') return url;
  const query = input.query;
  if (typeof query === 'string') return query;
  const path = input.path;
  if (typeof path === 'string') return path;
  return '';
}

export type MessageToolCallProps = {
  part: ToolPart;
  defaultOpen?: boolean;
  className?: string;
};

export function MessageToolCall({ part, defaultOpen = false, className }: MessageToolCallProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { tool, state } = part;
  const input = (state.input ?? {}) as Record<string, unknown>;
  const status = state.status;
  const isPending = status === 'pending' || status === 'running';

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const output = status === 'completed' ? (state as { output?: string }).output : undefined;
  const error = status === 'error' ? (state as { error?: string }).error : undefined;

  const filePath = typeof input.filePath === 'string' ? input.filePath : null;
  const isFileTool = tool === 'read' || tool === 'write' || tool === 'edit';

  const renderToolContent = () => {
    if (tool === 'bash' && typeof input.command === 'string') {
      return <div className={bashCommandStyle}>{input.command}</div>;
    }

    if (isFileTool && filePath) {
      return (
        <>
          <div className={filePathStyle}>{filePath}</div>
          {tool === 'read' && (
            <div className={fileViewerContainerStyle}>
              <FileViewer path={filePath} maxHeight={300} />
            </div>
          )}
          {tool === 'write' && typeof input.content === 'string' && (
            <div className={writeContentStyle}>{input.content}</div>
          )}
          {tool === 'edit' && (
            <>
              {typeof input.oldText === 'string' && (
                <div className={editDetailsStyle}>
                  <div style={{ color: 'var(--color-error)', marginBottom: 4 }}>- {input.oldText}</div>
                  {typeof input.newText === 'string' && (
                    <div style={{ color: 'var(--color-success)' }}>+ {input.newText}</div>
                  )}
                </div>
              )}
              {!input.oldText && output && <MarkdownRenderer text={output} />}
            </>
          )}
          {tool === 'read' && !output ? null : null}
        </>
      );
    }

    if ((tool === 'glob' || tool === 'grep') && typeof input.pattern === 'string') {
      return <div className={filePathStyle}>pattern: {input.pattern}</div>;
    }

    if ((tool === 'webfetch' || tool === 'websearch') && (typeof input.url === 'string' || typeof input.query === 'string')) {
      return (
        <div className={filePathStyle}>
          {typeof input.url === 'string' ? input.url : `query: ${String(input.query)}`}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cx(wrapperStyle, className)}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        <StatusIcon status={status} />
        <span className={toolNameStyle}>{getToolIcon(tool)} {tool}</span>
        <span className={subtitleStyle}>{getToolSubtitle(tool, input)}</span>
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorStyle}>{error}</div>}
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        {renderToolContent()}
        {output && tool !== 'read' && tool !== 'edit' && <MarkdownRenderer text={output} />}
      </div>
    </div>
  );
}
