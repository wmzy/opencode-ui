import { css, cx } from '@linaria/core';
import { useState, useCallback } from 'react';
import type { ReasoningPart } from '@/types/part';
import { MarkdownRenderer } from './markdown-renderer';

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
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const labelStyle = css`
  font-weight: 500;
  font-style: italic;
`;

const chevronStyle = css`
  margin-left: auto;
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
  font-size: 12px;
`;

const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

const contentStyle = css`
  padding: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
`;

const contentCollapsedStyle = css`
  display: none;
`;

export type MessageReasoningProps = {
  part: ReasoningPart;
  streaming?: boolean;
  className?: string;
};

export function MessageReasoning({ part, streaming = false, className }: MessageReasoningProps) {
  const [open, setOpen] = useState(false);
  const text = part.text?.trim();
  if (!text) return null;

  const handleToggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <div className={cx(wrapperStyle, className)}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        <span className={labelStyle}>💭 Reasoning</span>
        <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        <MarkdownRenderer text={text} streaming={streaming} />
      </div>
    </div>
  );
}
