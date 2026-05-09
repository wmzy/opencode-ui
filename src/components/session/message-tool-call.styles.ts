import { css } from '@linaria/core';

export const wrapperStyle = css`
  margin: 6px 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`;

export const triggerStyle = css`
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

export const iconStyle = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 14px;
`;

export const iconRunning = css`
  color: var(--color-accent);
`;

export const iconCompleted = css`
  color: var(--color-success);
`;

export const iconError = css`
  color: var(--color-error);
`;

export const toolNameStyle = css`
  font-weight: 500;
  flex-shrink: 0;
`;

export const subtitleStyle = css`
  color: var(--color-text-tertiary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const chevronStyle = css`
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
  font-size: 12px;
`;

export const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

export const contentStyle = css`
  padding: 12px;
  border-top: 1px solid var(--color-border);
  max-height: 400px;
  overflow-y: auto;
`;

export const contentCollapsedStyle = css`
  display: none;
`;

export const errorStyle = css`
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  color: var(--color-error);
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);
  white-space: pre-wrap;
  word-break: break-word;
`;

export const bashCommandStyle = css`
  font-family: var(--haze-font-mono, monospace);
  background: var(--color-bg-tertiary);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
`;

export const filePathStyle = css`
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 4px;
`;

export const fileViewerContainerStyle = css`
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
`;

export const writeContentStyle = css`
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  color: var(--color-text-secondary);
`;

export const editDetailsStyle = css`
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-family: var(--haze-font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  color: var(--color-text-secondary);
`;
