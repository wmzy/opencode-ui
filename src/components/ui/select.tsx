import { css, cx } from '@linaria/core';
import type { ReactNode } from 'react';

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

const selectBaseStyle = css`
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  transition: border-color 0.15s;

  &:focus {
    border-color: var(--color-accent);
  }
`;

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SelectProps = {
  label?: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export function Select({
  label,
  options,
  placeholder,
  value,
  className,
  onChange,
}: SelectProps) {
  return (
    <div className={cx(wrapperStyle, className)}>
      {label && <label className={labelStyle}>{label}</label>}
      <select className={selectBaseStyle} value={value} onChange={onChange}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {typeof opt.label === 'string' ? opt.label : String(opt.label)}
          </option>
        ))}
      </select>
    </div>
  );
}
