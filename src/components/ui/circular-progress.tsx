import { css, cx } from '@linaria/core';

export type CircularProgressProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
};

const svgStyle = css`
  transform: rotate(-90deg);
`;

export function CircularProgress({
  percentage,
  size = 40,
  strokeWidth = 3,
  color = 'var(--color-accent)',
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <svg
      className={cx(svgStyle, className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-valuenow={Math.round(clampedPercentage)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.2}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.4s ease',
        }}
      />
    </svg>
  );
}
