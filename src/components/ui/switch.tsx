import { css, cx } from '@linaria/core';
import { Switch as HazeSwitch } from 'haze-ui';
import type { ReactNode } from 'react';

const wrapperStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const labelStyle = css`
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
`;

const disabledLabelStyle = css`
  opacity: 0.5;
  cursor: not-allowed;
`;

export type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  disabled = false,
  size = 'md',
  className,
}: SwitchProps) {
  return (
    <label className={cx(wrapperStyle, className)}>
      <HazeSwitch
        checked={checked}
        size={size}
        onClick={() => {
          if (!disabled) onCheckedChange?.(!checked);
        }}
        disabled={disabled}
      />
      {label && (
        <span className={cx(labelStyle, disabled ? disabledLabelStyle : undefined)}>
          {label}
        </span>
      )}
    </label>
  );
}
