import { css, cx } from '@linaria/core';
import { useMemo, useState, useCallback } from 'react';
import type { FileDiff } from '@/types/common';
import { DiffChanges } from './diff-changes';
import { DiffViewer } from '@/components/file/diff-viewer';

export type DiffAccordionProps = {
  diffs: Array<FileDiff>;
  maxVisible?: number;
  className?: string;
};

const containerStyle = css`
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
`;

const headerLabelStyle = css`
  font-weight: 500;
`;

const headerToggleStyle = css`
  margin-left: auto;
  color: var(--color-accent);
  cursor: pointer;
  background: none;
  border: none;
  font-size: 12px;
  font-family: inherit;
  padding: 0;

  &:hover {
    color: var(--color-accent-hover);
  }
`;

const diffItemStyle = css`
  border-top: 1px solid var(--color-border);

  &:first-of-type {
    border-top: none;
  }
`;

const diffTriggerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  border: none;
  font-size: 12px;
  font-family: inherit;
  color: var(--color-text);
  text-align: left;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const diffTriggerLeftStyle = css`
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  overflow: hidden;
`;

const diffDirectoryStyle = css`
  color: var(--color-text-tertiary);
  flex-shrink: 0;
`;

const diffFilenameStyle = css`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const diffMetaStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const chevronStyle = css`
  width: 14px;
  height: 14px;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

const diffContentStyle = css`
  border-top: 1px solid var(--color-border);
  max-height: 400px;
  overflow: auto;
`;

const diffContentHiddenStyle = css`
  display: none;
`;

const moreButtonStyle = css`
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  font-family: inherit;
  color: var(--color-accent);
  cursor: pointer;
  text-align: center;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-accent-hover);
  }
`;

function getFilename(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, '');
  const parts = trimmed.split(/[/\\]/);
  return parts[parts.length - 1] ?? '';
}

function getDirectory(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, '');
  const parts = trimmed.split(/[/\\]/);
  const dir = parts.slice(0, parts.length - 1).join('/');
  return dir ? `${dir}/` : '';
}

function generateUnifiedDiff(before: string, after: string): string {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  if (beforeLines.length > 0 && beforeLines[beforeLines.length - 1] === '') {
    beforeLines.pop();
  }
  if (afterLines.length > 0 && afterLines[afterLines.length - 1] === '') {
    afterLines.pop();
  }

  const m = beforeLines.length;
  const n = afterLines.length;

  // For large files, skip LCS and use simple line-by-line diff
  if (m * n > 500_000) {
    const lines: string[] = [
      `@@ -1,${m} +1,${n} @@`,
    ];
    for (const line of beforeLines) lines.push(`-${line}`);
    for (const line of afterLines) lines.push(`+${line}`);
    return lines.join('\n');
  }

  // Compute LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  type DiffOp = { type: 'context' | 'add' | 'remove'; line: string };
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      ops.push({ type: 'context', line: beforeLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', line: afterLines[j - 1] });
      j--;
    } else {
      ops.push({ type: 'remove', line: beforeLines[i - 1] });
      i--;
    }
  }
  ops.reverse();

  // Group into hunks
  const hunks: Array<{ oldStart: number; newStart: number; ops: DiffOp[] }> = [];
  let currentHunk: { oldStart: number; newStart: number; ops: DiffOp[] } | null = null;

  const CONTEXT_LINES = 3;

  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    const isChange = op.type !== 'context';

    if (!currentHunk) {
      if (isChange) {
        // Look back for context
        const start = Math.max(0, k - CONTEXT_LINES);
        currentHunk = { oldStart: 1, newStart: 1, ops: [] };
        // Recalculate positions up to start
        let ol = 1;
        let nl = 1;
        for (let s = 0; s < start; s++) {
          if (ops[s].type === 'context' || ops[s].type === 'remove') ol++;
          if (ops[s].type === 'context' || ops[s].type === 'add') nl++;
        }
        currentHunk.oldStart = ol;
        currentHunk.newStart = nl;
        for (let s = start; s < k; s++) {
          currentHunk.ops.push(ops[s]);
        }
        currentHunk.ops.push(op);
      }
    } else {
      currentHunk.ops.push(op);
    }

    if (currentHunk && !isChange) {
      // Check if there are more changes within CONTEXT_LINES
      let hasMoreChanges = false;
      for (let l = k + 1; l < Math.min(k + 1 + CONTEXT_LINES, ops.length); l++) {
        if (ops[l].type !== 'context') {
          hasMoreChanges = true;
          break;
        }
      }
      if (!hasMoreChanges) {
        // Add trailing context and close hunk
        const remaining = Math.min(CONTEXT_LINES, ops.length - k - 1);
        for (let l = k + 1; l <= k + remaining; l++) {
          currentHunk.ops.push(ops[l]);
          k = l;
        }
        hunks.push(currentHunk);
        currentHunk = null;
      }
    }
  }
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  const lines: string[] = [];

  for (const hunk of hunks) {
    let oldCount = 0;
    let newCount = 0;
    for (const op of hunk.ops) {
      if (op.type === 'context' || op.type === 'remove') oldCount++;
      if (op.type === 'context' || op.type === 'add') newCount++;
    }
    lines.push(`@@ -${hunk.oldStart},${oldCount} +${hunk.newStart},${newCount} @@`);
    for (const op of hunk.ops) {
      if (op.type === 'context') lines.push(` ${op.line}`);
      else if (op.type === 'remove') lines.push(`-${op.line}`);
      else if (op.type === 'add') lines.push(`+${op.line}`);
    }
  }

  return lines.join('\n');
}

function DiffItem({ diff }: { diff: FileDiff }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      if (!prev && !hasBeenExpanded) {
        setHasBeenExpanded(true);
      }
      return !prev;
    });
  }, [hasBeenExpanded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const filename = getFilename(diff.file);
  const directory = getDirectory(diff.file);

  const patch = useMemo(() => {
    if (!hasBeenExpanded) return '';
    const d = diff as FileDiff & { patch?: string };
    if (typeof d.patch === 'string' && d.patch) {
      const lines = d.patch.split('\n');
      const cleaned = lines.filter(l => !l.startsWith('Index: ') && !l.startsWith('===') && !l.startsWith('--- ') && !l.startsWith('+++ '));
      return cleaned.join('\n');
    }
    if (diff.before == null && diff.after == null) return '';
    return generateUnifiedDiff(diff.before ?? '', diff.after ?? '');
  }, [hasBeenExpanded, diff.before, diff.after, diff.file, (diff as any).patch]);

  return (
    <div className={diffItemStyle}>
      <button
        className={diffTriggerStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
      >
        <span className={diffTriggerLeftStyle}>
          {directory && (
            <span className={diffDirectoryStyle}>{`\u202A${directory}\u202C`}</span>
          )}
          <span className={diffFilenameStyle}>{filename}</span>
        </span>
        <span className={diffMetaStyle}>
          <DiffChanges changes={diff} />
          <svg
            className={cx(chevronStyle, isExpanded && chevronExpandedStyle)}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      <div className={cx(diffContentStyle, !isExpanded && diffContentHiddenStyle)}>
        {hasBeenExpanded && patch && <DiffViewer patch={patch} />}
      </div>
    </div>
  );
}

export function DiffAccordion({ diffs, maxVisible = 10, className }: DiffAccordionProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleDiffs = useMemo(() => {
    if (showAll || diffs.length <= maxVisible) return diffs;
    return diffs.slice(0, maxVisible);
  }, [diffs, maxVisible, showAll]);

  const overflow = diffs.length - maxVisible;

  if (diffs.length === 0) return null;

  return (
    <div data-component="diff-accordion" className={cx(containerStyle, className)}>
      <div className={headerStyle}>
        <span className={headerLabelStyle}>
          {diffs.length} {diffs.length === 1 ? 'file' : 'files'} changed
        </span>
        <DiffChanges changes={diffs} />
        {overflow > 0 && (
          <button
            className={headerToggleStyle}
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'Show less' : `Show all ${overflow} more`}
          </button>
        )}
      </div>
      {visibleDiffs.map((diff) => (
        <DiffItem key={diff.file} diff={diff} />
      ))}
      {!showAll && overflow > 0 && (
        <button className={moreButtonStyle} onClick={() => setShowAll(true)}>
          {overflow} more {overflow === 1 ? 'file' : 'files'}
        </button>
      )}
    </div>
  );
}
