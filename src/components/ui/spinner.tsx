import { css, cx } from '@linaria/core';

const sizeMap = {
  sm: css`
    width: 14px;
    height: 14px;
    border-width: 2px;
  `,
  md: css`
    width: 20px;
    height: 20px;
    border-width: 2.5px;
  `,
  lg: css`
    width: 28px;
    height: 28px;
    border-width: 3px;
  `,
} as const;

const baseStyle = css`
  border-style: solid;
  border-color: transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ui-spinner-rotate 0.6s linear infinite;
  display: inline-block;

  @keyframes ui-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }
`;

const colorMap = {
  default: css`
    color: var(--color-text);
  `,
  primary: css`
    color: var(--color-accent);
  `,
  success: css`
    color: var(--color-success);
  `,
  error: css`
    color: var(--color-error);
  `,
  muted: css`
    color: var(--color-text-tertiary);
  `,
} as const;

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'success' | 'error' | 'muted';
  className?: string;
};

export function Spinner({
  size = 'md',
  color = 'default',
  className,
}: SpinnerProps) {
  return (
    <span
      className={cx(baseStyle, sizeMap[size], colorMap[color], className)}
      role="status"
      aria-label="Loading"
    />
  );
}
