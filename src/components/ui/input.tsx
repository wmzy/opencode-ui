import { css, cx } from '@linaria/core';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

const wrapperStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const labelStyle = css`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
`;

const inputWrapperStyle = css`
  position: relative;
  display: flex;
  align-items: center;
`;

const prefixStyle = css`
  position: absolute;
  left: 10px;
  display: flex;
  align-items: center;
  color: var(--color-text-tertiary);
  pointer-events: none;
  font-size: 14px;
`;

const suffixStyle = css`
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  color: var(--color-text-tertiary);
  pointer-events: none;
  font-size: 14px;
`;

const hasPrefixStyle = css`
  padding-left: 32px !important;
`;

const hasSuffixStyle = css`
  padding-right: 32px !important;
`;

const errorStyle = css`
  border-color: var(--color-error) !important;

  &:focus {
    border-color: var(--color-error) !important;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-error) 25%, transparent) !important;
  }
`;

const errorMessageStyle = css`
  font-size: 12px;
  color: var(--color-error);
`;

const inputBaseStyle = css`
  width: 100%;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: var(--color-accent);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const sizeStyles = {
  sm: css`font-size:13px;padding:6px 10px;`,
  md: css`font-size:14px;padding:8px 12px;`,
  lg: css`font-size:16px;padding:10px 14px;`,
};

export type InputProps = {
  label?: ReactNode;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'size'>;

export function Input({
  label,
  error,
  prefix,
  suffix,
  size = 'md',
  className,
  ...rest
}: InputProps) {
  return (
    <div className={cx(wrapperStyle, className)}>
      {label && <label className={labelStyle}>{label}</label>}
      <div className={inputWrapperStyle}>
        {prefix && <span className={prefixStyle}>{prefix}</span>}
        <input
          className={cx(
            inputBaseStyle,
            sizeStyles[size],
            prefix ? hasPrefixStyle : undefined,
            suffix ? hasSuffixStyle : undefined,
            error ? errorStyle : undefined,
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {suffix && <span className={suffixStyle}>{suffix}</span>}
      </div>
      {error && <span className={errorMessageStyle}>{error}</span>}
    </div>
  );
}
