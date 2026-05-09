import { css, cx } from '@linaria/core';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { DiffViewer } from '@/components/file/diff-viewer';
import { DiffChanges } from '@/components/session/diff-changes';
import { useSdk } from '@/context/sdk';
import { Spinner } from '@/components/ui/spinner';
import type { FileDiff } from '@/types/common';

export type SessionReviewTabProps = {
  sessionID: string;
  className?: string;
};

const containerStyle = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
`;

const headerLabelStyle = css`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const headerActionsStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const headerBtnStyle = css`
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const scrollAreaStyle = css`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
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
  flex: 1;
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
  margin-left: 8px;
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
  overflow: auto;
  max-height: 400px;
`;

const diffContentHiddenStyle = css`
  display: none;
`;

const emptyStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  text-align: center;
`;

const loadingStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 8px;
  color: var(--color-text-tertiary);
  font-size: 13px;
`;

const statusBadgeStyle = css`
  font-size: 10px;
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  margin-right: 2px;
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

function generateUnifiedDiff(before: string, after: string, filePath: string): string {
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

  if (m * n > 5_000_000) {
    const lines: string[] = [
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      `@@ -1,${m} +1,${n} @@`,
    ];
    for (const line of beforeLines) lines.push(`-${line}`);
    for (const line of afterLines) lines.push(`+${line}`);
    return lines.join('\n');
  }

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

  const hunks: Array<{ oldStart: number; newStart: number; ops: DiffOp[] }> = [];
  let currentHunk: { oldStart: number; newStart: number; ops: DiffOp[] } | null = null;

  const CONTEXT_LINES = 3;

  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    const isChange = op.type !== 'context';

    if (!currentHunk) {
      if (isChange) {
        const start = Math.max(0, k - CONTEXT_LINES);
        currentHunk = { oldStart: 1, newStart: 1, ops: [] };
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
      let hasMoreChanges = false;
      for (let l = k + 1; l < Math.min(k + 1 + CONTEXT_LINES, ops.length); l++) {
        if (ops[l].type !== 'context') {
          hasMoreChanges = true;
          break;
        }
      }
      if (!hasMoreChanges) {
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

  const lines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

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

type ReviewDiffItemProps = {
  diff: FileDiff;
  isExpanded: boolean;
  onToggle: () => void;
};

function ReviewDiffItem({ diff, isExpanded, onToggle }: ReviewDiffItemProps) {
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    if (!isExpanded && !hasBeenExpanded) {
      setHasBeenExpanded(true);
    }
    onToggle();
  }, [isExpanded, hasBeenExpanded, onToggle]);

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
    if (diff.before == null && diff.after == null) return '';
    return generateUnifiedDiff(diff.before ?? '', diff.after ?? '', diff.file);
  }, [hasBeenExpanded, diff.before, diff.after, diff.file]);

  const isNew = diff.before === '' && diff.after !== '';
  const isDeleted = diff.after === '' && diff.before !== '';

  return (
    <div className={diffItemStyle}>
      <button
        className={diffTriggerStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
      >
        <span className={diffTriggerLeftStyle}>
          {isNew && (
            <span className={statusBadgeStyle} style={{ color: '#3fb950' }}>A</span>
          )}
          {isDeleted && (
            <span className={statusBadgeStyle} style={{ color: '#f85149' }}>D</span>
          )}
          {!isNew && !isDeleted && (
            <span className={statusBadgeStyle} style={{ color: '#e2b340' }}>M</span>
          )}
          {directory && (
            <span className={diffDirectoryStyle}>{`\u202A${directory}\u202C`}</span>
          )}
          <span className={diffFilenameStyle}>{filename}</span>
        </span>
        <span className={diffMetaStyle}>
          <DiffChanges changes={diff} variant="bars" />
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
        {hasBeenExpanded && patch && <DiffViewer patch={patch} filePath={diff.file} />}
      </div>
    </div>
  );
}

export function SessionReviewTab({ sessionID, className }: SessionReviewTabProps) {
  const { getSdk } = useSdk();
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const sdk = getSdk(sessionID);
    sdk.session
      .diff(sessionID, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const items = (Array.isArray(data) ? data : []) as FileDiff[];
        setDiffs(items.filter((d) => d && typeof d.file === 'string'));
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load diffs');
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [sessionID, getSdk]);

  const toggleFile = useCallback((file: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedFiles(new Set(diffs.map((d) => d.file)));
  }, [diffs]);

  const collapseAll = useCallback(() => {
    setExpandedFiles(new Set());
  }, []);

  const allExpanded = diffs.length > 0 && expandedFiles.size === diffs.length;

  if (loading) {
    return (
      <div className={cx(containerStyle, className)}>
        <div className={loadingStyle}>
          <Spinner size="sm" color="muted" />
          <span>Loading diffs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx(containerStyle, className)}>
        <div className={emptyStyle}>
          Failed to load diffs: {error}
        </div>
      </div>
    );
  }

  if (diffs.length === 0) {
    return (
      <div className={cx(containerStyle, className)}>
        <div className={emptyStyle}>
          No file changes in this session
        </div>
      </div>
    );
  }

  return (
    <div className={cx(containerStyle, className)}>
      <div className={headerStyle}>
        <span className={headerLabelStyle}>
          {diffs.length} {diffs.length === 1 ? 'file' : 'files'} changed
        </span>
        <DiffChanges changes={diffs} />
        <div className={headerActionsStyle}>
          <button
            className={headerBtnStyle}
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>
      <div className={scrollAreaStyle}>
        {diffs.map((diff) => (
          <ReviewDiffItem
            key={diff.file}
            diff={diff}
            isExpanded={expandedFiles.has(diff.file)}
            onToggle={() => toggleFile(diff.file)}
          />
        ))}
      </div>
    </div>
  );
}
