import { css } from '@linaria/core';
import type { ToolRendererProps } from '../tool-types';
import { Spinner } from '@/components/ui/spinner';

const wrapperStyle = css`
  margin: 6px 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`;

const cardStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: var(--color-bg-secondary);
  font-family: inherit;
  font-size: 13px;
  color: var(--color-text);
  text-align: left;
  border: none;
  cursor: default;

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
`;

const titleStyle = css`
  font-weight: 500;
`;

const subtitleStyle = css`
  color: var(--color-text-tertiary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
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

const sessionIdStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-family: var(--haze-font-mono, monospace);
  margin-left: auto;
  flex-shrink: 0;
`;

const agentColors: Record<string, string> = {
  ask: 'var(--color-accent)',
  build: 'var(--color-success)',
  docs: 'var(--color-text-secondary)',
  plan: 'var(--color-warning)',
};

function getAgentColor(type?: string): string {
  if (!type) return 'var(--color-accent)';
  return agentColors[type.toLowerCase()] ?? 'var(--color-accent)';
}

function capitalizeAgent(type?: string): string {
  if (!type) return 'Agent';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function TaskToolRenderer({ input, metadata, status, error }: ToolRendererProps) {
  const agentType = typeof input.subagent_type === 'string' ? input.subagent_type : undefined;
  const description = typeof input.description === 'string' ? input.description : '';
  const sessionId = typeof metadata.sessionId === 'string' ? metadata.sessionId : undefined;
  const isPending = status === 'pending' || status === 'running';
  const color = getAgentColor(agentType);

  return (
    <div className={wrapperStyle}>
      <div className={cardStyle}>
        <span className={iconStyle} style={{ color }}>
          {isPending ? (
            <Spinner size="sm" color="primary" />
          ) : status === 'error' ? (
            <span style={{ color: 'var(--color-error)' }}>✕</span>
          ) : (
            <span style={{ color: 'var(--color-success)' }}>✓</span>
          )}
        </span>
        <span className={titleStyle} style={{ color }}>
          {capitalizeAgent(agentType)}
        </span>
        {description && (
          <span className={subtitleStyle}>{description}</span>
        )}
        {sessionId && !description && (
          <span className={sessionIdStyle}>{sessionId.slice(0, 8)}</span>
        )}
      </div>
      {error && <div className={errorBoxStyle}>{error}</div>}
    </div>
  );
}
