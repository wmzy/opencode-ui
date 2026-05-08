import { css, cx } from '@linaria/core';
import { Badge as HazeBadge } from 'haze-ui';
import type { ReactNode } from 'react';

const variantMap = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info',
} as const;

const sizeStyles = {
  sm: css`
    font-size: 11px;
    padding: 2px 6px;
  `,
  md: css`
    font-size: 12px;
    padding: 3px 8px;
  `,
} as const;

export type BadgeProps = {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <HazeBadge variant={variantMap[variant]} size={size} className={cx(sizeStyles[size], className)}>
      {children}
    </HazeBadge>
  );
}
