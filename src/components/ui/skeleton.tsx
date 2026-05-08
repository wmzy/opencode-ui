import { css, cx } from '@linaria/core';
import { Skeleton as HazeSkeleton } from 'haze-ui';

const pulseAnimation = css`
  @keyframes ui-skeleton-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  animation: ui-skeleton-pulse 1.5s ease-in-out infinite;
`;

export type SkeletonProps = {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  animated?: boolean;
  className?: string;
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  animated = true,
  className,
}: SkeletonProps) {
  const hazeVariant = variant === 'circle' ? 'circular' : variant === 'rectangle' ? 'rectangular' : 'text';

  const defaultHeight = variant === 'text' ? '14px' : variant === 'circle' ? width ?? '40px' : '100px';

  return (
    <HazeSkeleton
      variant={hazeVariant}
      width={width}
      height={height ?? defaultHeight}
      className={cx(animated ? pulseAnimation : undefined, className)}
    />
  );
}
