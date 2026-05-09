import { css, cx } from '@linaria/core';
import { useState, useCallback, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';

const wrapperStyle = css`
  margin: 6px 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`;

const triggerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  border: none;
  font-family: inherit;
  font-size: 13px;
  color: var(--color-text);
  text-align: left;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const triggerLockedStyle = css`
  cursor: default;

  &:hover {
    background: var(--color-bg-secondary);
  }
`;

const iconStyle = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 14px;
`;

const iconRunning = css`
  color: var(--color-accent);
`;

const iconCompleted = css`
  color: var(--color-success);
`;

const iconError = css`
  color: var(--color-error);
`;

const chevronStyle = css`
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
  font-size: 12px;
`;

const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

const contentStyle = css`
  border-top: 1px solid var(--color-border);
`;

const contentOpenStyle = css`
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const contentCollapsedStyle = css`
  display: none;
`;

const errorBoxStyle = css`
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  color: var(--color-error);
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);
  white-space: pre-wrap;
  word-break: break-word;
`;

export type ToolContainerProps = {
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  defaultOpen?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ToolContainer({
  status,
  error,
  defaultOpen = false,
  icon,
  children,
  className,
}: ToolContainerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isPending = status === 'pending' || status === 'running';

  const handleToggle = useCallback(() => {
    if (isPending) return;
    setOpen((prev) => !prev);
  }, [isPending]);

  const statusIcon = (() => {
    if (isPending) {
      return <span className={cx(iconStyle, iconRunning)}><Spinner size="sm" color="primary" /></span>;
    }
    if (status === 'error') {
      return <span className={cx(iconStyle, iconError)}>✕</span>;
    }
    if (icon) return <span className={iconStyle}>{icon}</span>;
    return <span className={cx(iconStyle, iconCompleted)}>✓</span>;
  })();

  return (
    <div className={cx(wrapperStyle, className)}>
      <button
        className={cx(triggerStyle, isPending && triggerLockedStyle)}
        onClick={handleToggle}
        aria-expanded={open}
      >
        {statusIcon}
        {children && (
          <svg
            className={cx(chevronStyle, open && chevronExpandedStyle)}
            viewBox="0 0 20 20"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      {error && <div className={errorBoxStyle}>{error}</div>}
      {children && (
        <div className={cx(contentStyle, open ? contentOpenStyle : contentCollapsedStyle)}>
          {children}
        </div>
      )}
    </div>
  );
}
