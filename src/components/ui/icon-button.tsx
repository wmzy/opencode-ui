import { css, cx } from '@linaria/core';
import { Button as HazeButton } from 'haze-ui';
import { Tooltip } from './tooltip';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

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

const sizeMap = {
  sm: css`
    width: 28px;
    height: 28px;
    font-size: 14px;
  `,
  md: css`
    width: 36px;
    height: 36px;
    font-size: 16px;
  `,
  lg: css`
    width: 44px;
    height: 44px;
    font-size: 18px;
  `,
} as const;

const iconCenterStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

export type IconButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>;

export function IconButton({
  variant = 'ghost',
  size = 'md',
  tooltip,
  children,
  className,
  disabled,
  ...rest
}: IconButtonProps) {
  const button = (
    <HazeButton
      variant={variantMap[variant]}
      size={size}
      square
      className={cx(
        variant === 'danger' ? dangerStyle : undefined,
        sizeMap[size],
        iconCenterStyle,
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </HazeButton>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
}
