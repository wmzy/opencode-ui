import { css, cx } from '@linaria/core';
import type { ReactNode } from 'react';
import { useState } from 'react';

const containerStyle = css`
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`;

const triggerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const chevronStyle = css`
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

const contentStyle = css`
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
`;

const contentCollapsedStyle = css`
  display: none;
`;

export type CollapsibleProps = {
  trigger: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
};

export function Collapsible({
  trigger,
  defaultExpanded = false,
  children,
  className,
}: CollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => setIsExpanded((prev) => !prev);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cx(containerStyle, className)}>
      <button
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={triggerStyle}
      >
        {trigger}
        <svg
          className={cx(chevronStyle, isExpanded && chevronExpandedStyle)}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        className={cx(contentStyle, !isExpanded && contentCollapsedStyle)}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}
