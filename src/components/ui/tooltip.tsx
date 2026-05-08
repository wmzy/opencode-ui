import { css, cx } from '@linaria/core';
import { Tooltip as HazeTooltip } from 'haze-ui';
import type { ReactNode } from 'react';

const tooltipContentStyle = css`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  white-space: nowrap;
  pointer-events: none;
  z-index: 1200;
`;

export type TooltipProps = {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: ReactNode;
  className?: string;
};

export function Tooltip({
  content,
  position = 'top',
  children,
  className,
}: TooltipProps) {
  if (!content) return <>{children}</>;

  return (
    <HazeTooltip content={<span className={cx(tooltipContentStyle, className)}>{content}</span>} position={position}>
      {children}
    </HazeTooltip>
  );
}
