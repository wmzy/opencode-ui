import { css, cx } from '@linaria/core';
import { Button as HazeButton } from 'haze-ui';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

const spinnerStyle = css`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ui-btn-spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 6px;

  @keyframes ui-btn-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const variantMap = {
  primary: 'solid',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'solid',
} as const;

const dangerStyle = css`
  --haze-color-primary: var(--color-error);
  --haze-color-primary-hover: #dc2626;
  --haze-color-primary-active: #b91c1c;
`;

const fullWidthStyle = css`
  width: 100%;
`;

const iconSlotStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>;

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <HazeButton
      variant={variantMap[variant]}
      size={size}
      className={cx(
        variant === 'danger' ? dangerStyle : undefined,
        fullWidth ? fullWidthStyle : undefined,
        className,
      )}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <span className={spinnerStyle} />}
      {iconLeft || iconRight ? (
        <span className={iconSlotStyle}>
          {iconLeft}
          {children}
          {iconRight}
        </span>
      ) : (
        children
      )}
    </HazeButton>
  );
}
