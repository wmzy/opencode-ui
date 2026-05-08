import { css, cx } from '@linaria/core';
import { Dialog as HazeDialog } from 'haze-ui';
import type { ReactNode } from 'react';

const overlayStyle = css`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const contentStyle = css`
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  outline: none;
`;

const headerStyle = css`
  padding: 20px 24px 0;
`;

const titleStyle = css`
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
`;

const descriptionStyle = css`
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
`;

const bodyStyle = css`
  padding: 16px 24px;
`;

const footerStyle = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px 20px;
`;

const closeButtonStyle = css`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 6px;
  font-size: 18px;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
  footer?: ReactNode;
  raw?: boolean;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  className,
  children,
  footer,
  raw = false,
}: DialogProps) {
  if (!open) return null;

  return (
    <HazeDialog open={open} onClose={onClose}>
      <div className={overlayStyle} onClick={onClose}>
        <div
          className={cx(contentStyle, className)}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
        >
          <button className={closeButtonStyle} onClick={onClose} aria-label="Close">
            ×
          </button>
          {(title || description) && (
            <div className={headerStyle}>
              {title && <h2 className={titleStyle} id="dialog-title">{title}</h2>}
              {description && <p className={descriptionStyle}>{description}</p>}
            </div>
          )}
          {children && (raw ? children : <div className={bodyStyle}>{children}</div>)}
          {footer && <div className={footerStyle}>{footer}</div>}
        </div>
      </div>
    </HazeDialog>
  );
}
