import { css, cx } from '@linaria/core';
import { useState, useCallback, useMemo } from 'react';
import type { ToolRendererProps } from '../tool-types';
import { DiffViewer } from '@/components/file/diff-viewer';
import { DiffChanges } from '../diff-changes';

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

const diffStatsStyle = css`
  margin-left: 8px;
  flex-shrink: 0;
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

const fallbackDiffStyle = css`
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

const removedLineStyle = css`
  color: var(--color-error);
  margin-bottom: 4px;
`;

const addedLineStyle = css`
  color: var(--color-success);
`;

function generateUnifiedDiff(before: string, after: string): string {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const lines: string[] = [];

  lines.push(`@@ -1,${beforeLines.length} +1,${afterLines.length} @@`);

  for (const line of beforeLines) {
    lines.push(`-${line}`);
  }
  for (const line of afterLines) {
    lines.push(`+${line}`);
  }

  return lines.join('\n');
}

function getFilename(path: string): string {
  return path.split('/').pop() ?? path;
}

export function EditToolRenderer({ input, metadata, output, status, error, defaultOpen = false }: ToolRendererProps) {
  const isPending = status === 'pending' || status === 'running';

  const filePath = typeof input.filePath === 'string' ? input.filePath : '';
  const filename = filePath ? getFilename(filePath) : '';

  const filediff = metadata.filediff as { before?: string; after?: string; patch?: string; additions?: number; deletions?: number; file?: string } | undefined;
  const hasDiffStats = !!filediff && (typeof filediff.additions === 'number' || typeof filediff.deletions === 'number');

  return (
    <EditToolInner
      status={status}
      error={error}
      defaultOpen={defaultOpen}
      isPending={isPending}
      filename={filename}
      filePath={filePath}
      hasDiffStats={hasDiffStats}
      filediff={filediff}
      input={input}
      output={output}
    />
  );
}

type EditToolInnerProps = {
  status: ToolRendererProps['status'];
  error?: string;
  defaultOpen?: boolean;
  isPending: boolean;
  filename: string;
  filePath: string;
  hasDiffStats: boolean;
  filediff?: { before?: string; after?: string; patch?: string; additions?: number; deletions?: number; file?: string };
  input: Record<string, unknown>;
  output?: string;
};

function EditToolInner({
  status,
  error,
  defaultOpen = false,
  isPending,
  filename,
  filePath,
  hasDiffStats,
  filediff,
  input,
  output,
}: EditToolInnerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hasBeenOpen, setHasBeenOpen] = useState(defaultOpen);
  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => {
      if (!prev && !hasBeenOpen) setHasBeenOpen(true);
      return !prev;
    });
  }, [isPending, hasBeenOpen]);

  const diffPatch = useMemo(() => {
    if (!hasBeenOpen) return null;
    if (typeof filediff?.patch === 'string' && filediff.patch) {
      const lines = filediff.patch.split('\n');
      const cleaned = lines.filter(l => !l.startsWith('Index: ') && !l.startsWith('===') && !l.startsWith('--- ') && !l.startsWith('+++ '));
      return cleaned.join('\n');
    }
    const before = filediff?.before || (typeof input.oldString === 'string' ? input.oldString : typeof input.oldText === 'string' ? input.oldText : '');
    const after = filediff?.after || (typeof input.newString === 'string' ? input.newString : typeof input.newText === 'string' ? input.newText : '');
    if (!before && !after) return null;
    return generateUnifiedDiff(before, after);
  }, [hasBeenOpen, filediff?.patch, filediff?.before, filediff?.after, input.oldText, input.newText, input.oldString, input.newString]);

  const statusIcon = (() => {
    if (isPending) return <span className={cx(iconStyle, iconRunning)}>✏️</span>;
    if (status === 'error') return <span className={cx(iconStyle, iconError)}>✕</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  const triggerSubtitle = isPending ? 'Editing...' : (filePath || filename);

  return (
    <div className={wrapperStyle}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        {statusIcon}
        <span className={toolNameStyle}>Edit</span>
        <span className={subtitleStyle}>{triggerSubtitle}</span>
        {hasDiffStats && filediff && (
          <span className={diffStatsStyle}>
            <DiffChanges changes={{ additions: filediff.additions ?? 0, deletions: filediff.deletions ?? 0 }} />
          </span>
        )}
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      {open && (
        <div className={contentStyle} style={{ padding: 12 }}>
          {diffPatch ? (
            <DiffViewer patch={diffPatch} />
          ) : (typeof input.oldText === 'string' || typeof input.oldString === 'string') ? (
            <div className={fallbackDiffStyle}>
              <div className={removedLineStyle}>- {String(input.oldText ?? input.oldString)}</div>
              {(typeof input.newText === 'string' || typeof input.newString === 'string') && (
                <div className={addedLineStyle}>+ {String(input.newText ?? input.newString)}</div>
              )}
            </div>
          ) : output ? null : null}
        </div>
      )}
    </div>
  );
}
