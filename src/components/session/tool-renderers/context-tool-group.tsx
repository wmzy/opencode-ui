import { css, cx } from '@linaria/core';
import { useState, useCallback } from 'react';
import type { ToolPart } from '@/types/part';
import { Spinner } from '@/components/ui/spinner';

const CONTEXT_GROUP_TOOLS = new Set(['read', 'glob', 'grep', 'list']);

export function isContextGroupTool(part: { type: string; tool?: string }): boolean {
  return part.type === 'tool' && !!part.tool && CONTEXT_GROUP_TOOLS.has(part.tool);
}

const containerStyle = css`
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

  &:hover {
    background: var(--color-bg-tertiary);
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
  color: var(--color-accent);
`;

const iconCompleted = css`
  color: var(--color-success);
`;

const titleStyle = css`
  font-weight: 500;
  flex-shrink: 0;
`;

const summaryStyle = css`
  color: var(--color-text-tertiary);
  font-size: 12px;
  min-width: 0;
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
  padding: 4px 0;
`;

const contentCollapsedStyle = css`
  display: none;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const itemToolNameStyle = css`
  font-weight: 500;
  color: var(--color-text);
  flex-shrink: 0;
  min-width: 36px;
`;

const itemSubtitleStyle = css`
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-family: var(--haze-font-mono, monospace);
`;

const itemStatusStyle = css`
  margin-left: auto;
  flex-shrink: 0;
`;

type ContextToolGroupProps = {
  parts: ToolPart[];
  isStreaming?: boolean;
};

function getContextToolSubtitle(part: ToolPart): string {
  const input = (part.state.input ?? {}) as Record<string, unknown>;

  const desc = input.description;
  if (typeof desc === 'string' && desc) return desc;

  const filePath = input.filePath;
  if (typeof filePath === 'string' && filePath) return filePath.split('/').pop() ?? filePath;

  const pattern = input.pattern;
  if (typeof pattern === 'string') return pattern;

  const path = input.path;
  if (typeof path === 'string') return path;

  return '';
}

export function ContextToolGroup({ parts, isStreaming = false }: ContextToolGroupProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const isBusy = isStreaming || parts.some(
    (p) => p.state.status === 'pending' || p.state.status === 'running',
  );

  const readCount = parts.filter((p) => p.tool === 'read').length;
  const searchCount = parts.filter((p) => p.tool === 'glob' || p.tool === 'grep').length;
  const listCount = parts.filter((p) => p.tool === 'list').length;

  const summaryParts: string[] = [];
  if (readCount > 0) summaryParts.push(`${readCount} read`);
  if (searchCount > 0) summaryParts.push(`${searchCount} search`);
  if (listCount > 0) summaryParts.push(`${listCount} list`);
  const summaryText = summaryParts.join(' · ');

  return (
    <div className={containerStyle}>
      <button className={triggerStyle} onClick={handleToggle} aria-expanded={open}>
        {isBusy ? (
          <span className={iconStyle}><Spinner size="sm" color="primary" /></span>
        ) : (
          <span className={cx(iconStyle, iconCompleted)}>✓</span>
        )}
        <span className={titleStyle}>
          {isBusy ? 'Gathering context...' : 'Context gathered'}
        </span>
        <span className={summaryStyle}>{summaryText}</span>
        <svg className={cx(chevronStyle, open && chevronExpandedStyle)} viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className={cx(contentStyle, !open && contentCollapsedStyle)}>
        {parts.map((part) => {
          const isPartBusy = part.state.status === 'pending' || part.state.status === 'running';
          const toolLabel = part.tool.charAt(0).toUpperCase() + part.tool.slice(1);
          const subtitle = getContextToolSubtitle(part);

          return (
            <div key={part.id} className={itemStyle}>
              <span className={itemToolNameStyle}>{toolLabel}</span>
              <span className={itemSubtitleStyle}>{subtitle}</span>
              <span className={itemStatusStyle}>
                {isPartBusy ? (
                  <Spinner size="sm" color="muted" />
                ) : part.state.status === 'error' ? (
                  <span style={{ color: 'var(--color-error)' }}>✕</span>
                ) : (
                  <span style={{ color: 'var(--color-success)' }}>✓</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
