import { useState, useCallback } from 'react';
import type { ToolPart } from '@/types/part';
import { registerTool, getToolRenderer } from './tool-registry';
import { MarkdownRenderer } from './markdown-renderer';
import { FileViewer } from '@/components/file/file-viewer';
import { Spinner } from '@/components/ui/spinner';
import { BashToolRenderer } from './tool-renderers/bash-tool';
import { EditToolRenderer } from './tool-renderers/edit-tool';
import { ReadToolRenderer } from './tool-renderers/read-tool';
import { WriteToolRenderer } from './tool-renderers/write-tool';
import { GlobToolRenderer, GrepToolRenderer, ListToolRenderer } from './tool-renderers/search-tools';
import { WebFetchToolRenderer, WebSearchToolRenderer } from './tool-renderers/web-tools';
import { TaskToolRenderer } from './tool-renderers/task-tool';
import { ApplyPatchToolRenderer } from './tool-renderers/apply-patch-tool';
import {
  wrapperStyle,
  triggerStyle,
  iconStyle,
  iconRunning,
  iconCompleted,
  iconError,
  toolNameStyle,
  subtitleStyle,
  chevronStyle,
  chevronExpandedStyle,
  contentStyle,
  contentCollapsedStyle,
  errorStyle,
  bashCommandStyle,
  filePathStyle,
  fileViewerContainerStyle,
  writeContentStyle,
  editDetailsStyle,
} from './message-tool-call.styles';

registerTool({ name: 'bash', render: BashToolRenderer });
registerTool({ name: 'edit', render: EditToolRenderer });
registerTool({ name: 'read', render: ReadToolRenderer });
registerTool({ name: 'write', render: WriteToolRenderer });
registerTool({ name: 'glob', render: GlobToolRenderer });
registerTool({ name: 'grep', render: GrepToolRenderer });
registerTool({ name: 'list', render: ListToolRenderer });
registerTool({ name: 'webfetch', render: WebFetchToolRenderer });
registerTool({ name: 'websearch', render: WebSearchToolRenderer });
registerTool({ name: 'task', render: TaskToolRenderer });
registerTool({ name: 'apply_patch', render: ApplyPatchToolRenderer });

function cx(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(' ');
}

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
  const metadata = (state as { metadata?: Record<string, unknown> }).metadata ?? {};

  const RegisteredRenderer = getToolRenderer(tool);
  if (RegisteredRenderer) {
    return (
      <RegisteredRenderer
        input={input}
        metadata={metadata}
        tool={tool}
        output={output}
        status={status}
        error={error}
        defaultOpen={defaultOpen}
      />
    );
  }

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
              {(typeof input.oldText === 'string' || typeof input.oldString === 'string') && (
                <div className={editDetailsStyle}>
                  <div style={{ color: 'var(--color-error)', marginBottom: 4 }}>- {String(input.oldText ?? input.oldString)}</div>
                  {(typeof input.newText === 'string' || typeof input.newString === 'string') && (
                    <div style={{ color: 'var(--color-success)' }}>+ {String(input.newText ?? input.newString)}</div>
                  )}
                </div>
              )}
              {!input.oldText && !input.oldString && output && <MarkdownRenderer text={output} />}
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
