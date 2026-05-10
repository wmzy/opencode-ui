import { css, cx } from '@linaria/core';
import type { StepStartPart, StepFinishPart } from '@/types/part';

const stepStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  margin: 4px 0;
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
`;

const dotStyle = css`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  flex-shrink: 0;
`;

const dotCompletedStyle = css`
  background: var(--color-success);
`;

const costStyle = css`
  margin-left: auto;
  font-size: 11px;
  opacity: 0.7;
`;

export type MessageStepProps = {
  start?: StepStartPart;
  finish?: StepFinishPart;
  className?: string;
};

export function MessageStep({ finish, className }: MessageStepProps) {
  const label = finish?.reason ?? 'step';
  const isCompleted = !!finish;

  return (
    <div className={cx(stepStyle, className)}>
      <span className={cx(dotStyle, isCompleted && dotCompletedStyle)} />
      <span>{label}</span>
      {finish && finish.cost > 0 && (
        <span className={costStyle}>${finish.cost.toFixed(4)}</span>
      )}
    </div>
  );
}
