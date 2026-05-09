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
  max-height: 500px;
  overflow-y: auto;
  padding: 0;
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

const fileListStyle = css`
  padding: 8px 0;
`;

const fileItemStyle = css`
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const fileHeaderStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const fileNameStyle = css`
  color: var(--color-accent);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const diffContainerStyle = css`
  border-top: 1px solid var(--color-border);
`;

type PatchFile = {
  filePath: string;
  patch: string;
  additions: number;
  deletions: number;
  type: string;
};

function parsePatchFiles(metadata: Record<string, unknown>): PatchFile[] {
  const files = metadata.files;
  if (!Array.isArray(files)) return [];

  return files.map((f: Record<string, unknown>) => {
    const fileDiff = f.fileDiff as Record<string, unknown> | undefined;
    const hunks = fileDiff?.hunks as Array<Record<string, unknown>> | undefined;

    let additions = 0;
    let deletions = 0;
    let patch = '';

    if (Array.isArray(hunks)) {
      const lines: string[] = [];
      for (const hunk of hunks) {
        const changes = hunk.changes as Array<Record<string, unknown>> | undefined;
        const newStart = typeof hunk.newStart === 'number' ? hunk.newStart : 1;
        const newLines = typeof hunk.newLines === 'number' ? hunk.newLines : 0;
        const oldStart = typeof hunk.oldStart === 'number' ? hunk.oldStart : 1;
        const oldLines = typeof hunk.oldLines === 'number' ? hunk.oldLines : 0;

        lines.push(`@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`);

        if (Array.isArray(changes)) {
          for (const change of changes) {
            const kind = typeof change.type === 'string' ? change.type : 'normal';
            const content = typeof change.content === 'string' ? change.content : '';
            if (kind === 'add') {
              additions++;
              lines.push(`+${content}`);
            } else if (kind === 'delete') {
              deletions++;
              lines.push(`-${content}`);
            } else {
              lines.push(` ${content}`);
            }
          }
        }
      }
      patch = lines.join('\n');
    }

    return {
      filePath: typeof f.filePath === 'string' ? f.filePath : '',
      patch,
      additions,
      deletions,
      type: typeof f.type === 'string' ? f.type : 'modify',
    };
  }).filter((f) => f.filePath);
}

export function ApplyPatchToolRenderer({ input, metadata, status, error, defaultOpen = false }: ToolRendererProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isPending = status === 'pending' || status === 'running';

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const files = useMemo(() => parsePatchFiles(metadata), [metadata]);
  const inputFiles = input.files as Array<unknown> | undefined;
  const fileCount = files.length || (Array.isArray(inputFiles) ? inputFiles.length : 0);

  const statusIcon = (() => {
    if (isPending) return <span className={cx(iconStyle, iconRunning)}>🔧</span>;
    if (status === 'error') return <span className={cx(iconStyle, iconError)}>✕</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  return (
    <div className={wrapperStyle}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        {statusIcon}
        <span className={toolNameStyle}>Patch</span>
        <span className={subtitleStyle}>
          {isPending ? 'Applying...' : `${fileCount} file${fileCount !== 1 ? 's' : ''}`}
        </span>
        {!isPending && (
          <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        <PatchFileList files={files} />
      </div>
    </div>
  );
}

function PatchFileList({ files }: { files: PatchFile[] }) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() => {
    return new Set(files.slice(0, 1).map((f) => f.filePath));
  });

  const toggleFile = useCallback((filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }, []);

  if (files.length === 0) return null;

  return (
    <div className={fileListStyle}>
      {files.map((file) => {
        const isExpanded = expandedFiles.has(file.filePath);
        return (
          <div key={file.filePath} className={fileItemStyle}>
            <div className={fileHeaderStyle} onClick={() => toggleFile(file.filePath)}>
              <span className={fileNameStyle}>{file.filePath}</span>
              <DiffChanges changes={{ additions: file.additions, deletions: file.deletions }} />
              <svg
                className={cx(chevronStyle, isExpanded && chevronExpandedStyle)}
                viewBox="0 0 20 20"
                fill="currentColor"
                width="12"
                height="12"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {isExpanded && file.patch && (
              <div className={diffContainerStyle}>
                <DiffViewer patch={file.patch} filePath={file.filePath} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
