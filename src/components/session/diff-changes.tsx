import { css, cx } from '@linaria/core';
import { useMemo } from 'react';

type ChangeInput = { additions: number; deletions: number };

export type DiffChangesProps = {
  changes: ChangeInput | Array<ChangeInput>;
  variant?: 'default' | 'bars';
  className?: string;
};

const containerStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-family: inherit;
  line-height: 1;
`;

const additionsStyle = css`
  color: var(--color-success);
  font-weight: 500;
`;

const deletionsStyle = css`
  color: var(--color-error);
  font-weight: 500;
`;

const barsSvgStyle = css`
  width: 18px;
  height: 14px;
  flex-shrink: 0;
`;

const ADD_COLOR = 'var(--color-success)';
const DELETE_COLOR = 'var(--color-error)';
const NEUTRAL_COLOR = 'var(--color-text-tertiary)';

function computeTotals(changes: ChangeInput | Array<ChangeInput>) {
  if (Array.isArray(changes)) {
    return {
      additions: changes.reduce((acc, d) => acc + (d.additions ?? 0), 0),
      deletions: changes.reduce((acc, d) => acc + (d.deletions ?? 0), 0),
    };
  }
  return {
    additions: changes.additions ?? 0,
    deletions: changes.deletions ?? 0,
  };
}

function computeBlockCounts(adds: number, dels: number) {
  const TOTAL_BLOCKS = 5;

  if (adds === 0 && dels === 0) {
    return { added: 0, deleted: 0, neutral: TOTAL_BLOCKS };
  }

  const total = adds + dels;

  if (total < 5) {
    const added = adds > 0 ? 1 : 0;
    const deleted = dels > 0 ? 1 : 0;
    const neutral = TOTAL_BLOCKS - added - deleted;
    return { added, deleted, neutral };
  }

  const ratio = adds > dels ? adds / dels : dels / adds;
  let BLOCKS_FOR_COLORS = TOTAL_BLOCKS;

  if (total < 20) {
    BLOCKS_FOR_COLORS = TOTAL_BLOCKS - 1;
  } else if (ratio < 4) {
    BLOCKS_FOR_COLORS = TOTAL_BLOCKS - 1;
  }

  const percentAdded = adds / total;
  const percentDeleted = dels / total;

  const added_raw = percentAdded * BLOCKS_FOR_COLORS;
  const deleted_raw = percentDeleted * BLOCKS_FOR_COLORS;

  let added = adds > 0 ? Math.max(1, Math.round(added_raw)) : 0;
  let deleted = dels > 0 ? Math.max(1, Math.round(deleted_raw)) : 0;

  if (adds > 0 && adds <= 5) added = Math.min(added, 1);
  if (adds > 5 && adds <= 10) added = Math.min(added, 2);
  if (dels > 0 && dels <= 5) deleted = Math.min(deleted, 1);
  if (dels > 5 && dels <= 10) deleted = Math.min(deleted, 2);

  let total_allocated = added + deleted;
  if (total_allocated > BLOCKS_FOR_COLORS) {
    if (added_raw > deleted_raw) {
      added = BLOCKS_FOR_COLORS - deleted;
    } else {
      deleted = BLOCKS_FOR_COLORS - added;
    }
    total_allocated = added + deleted;
  }

  const neutral = Math.max(0, TOTAL_BLOCKS - total_allocated);
  return { added, deleted, neutral };
}

export function DiffChanges({ changes, variant = 'default', className }: DiffChangesProps) {
  const { additions, deletions } = useMemo(() => computeTotals(changes), [changes]);
  const total = additions + deletions;

  const blocks = useMemo(() => {
    const counts = computeBlockCounts(additions, deletions);
    const result: string[] = [
      ...Array(counts.added).fill(ADD_COLOR),
      ...Array(counts.deleted).fill(DELETE_COLOR),
      ...Array(counts.neutral).fill(NEUTRAL_COLOR),
    ];
    return result.slice(0, 5);
  }, [additions, deletions]);

  if (variant === 'default' && total === 0) return null;

  if (variant === 'bars') {
    return (
      <div data-component="diff-changes" data-variant="bars" className={cx(containerStyle, className)}>
        <svg className={barsSvgStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 14" fill="none">
          <g>
            {blocks.map((color, i) => (
              <rect key={i} x={i * 4} width="2" height="14" rx="1" fill={color} />
            ))}
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div data-component="diff-changes" data-variant="default" className={cx(containerStyle, className)}>
      <span data-slot="diff-changes-additions" className={additionsStyle}>
        {`+${additions}`}
      </span>
      <span data-slot="diff-changes-deletions" className={deletionsStyle}>
        {`-${deletions}`}
      </span>
    </div>
  );
}
