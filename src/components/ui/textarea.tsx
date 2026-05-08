import { css, cx } from '@linaria/core';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useRef, useCallback } from 'react';

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

const autoResizeStyle = css`
  resize: none;
  overflow: hidden;
  min-height: 60px;
`;

const textareaBaseStyle = css`
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: inherit;
  line-height: 1.5;
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

export type TextareaProps = {
  label?: ReactNode;
  error?: string;
  autoResize?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & Omit<ComponentPropsWithoutRef<'textarea'>, 'size'>;

export function Textarea({
  label,
  error,
  autoResize = false,
  size = 'md',
  className,
  ...rest
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
      rest.onChange?.(e);
    },
    [autoResize, rest.onChange],
  );

  return (
    <div className={cx(wrapperStyle, className)}>
      {label && <label className={labelStyle}>{label}</label>}
      <textarea
        ref={ref}
        className={cx(
          textareaBaseStyle,
          sizeStyles[size],
          error ? errorStyle : undefined,
          autoResize ? autoResizeStyle : undefined,
        )}
        aria-invalid={!!error}
        {...rest}
        onChange={handleInput}
      />
      {error && <span className={errorMessageStyle}>{error}</span>}
    </div>
  );
}
