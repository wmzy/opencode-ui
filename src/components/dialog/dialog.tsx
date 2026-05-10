import { css, cx } from '@linaria/core';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

const overlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.open {
    opacity: 1;
  }
`;

const dialogStyle = css`
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  max-width: 560px;
  width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.95) translateY(10px);
  transition: transform 0.2s ease;

  &.open {
    transform: scale(1) translateY(0);
  }
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
`;

const titleStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`;

const closeButton = css`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 18px;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const bodyStyle = css`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const footerStyle = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
`;

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  raw?: boolean;
};

export function Dialog({ open, onClose, title, children, footer, raw = false, className: _className }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className={cx(overlayStyle, open && 'open')} onClick={onClose}>
      <div
        ref={dialogRef}
        className={cx(dialogStyle, open && 'open')}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className={headerStyle}>
            <span className={titleStyle}>{title}</span>
            <button className={closeButton} onClick={onClose}>
              ✕
            </button>
          </div>
        )}
        {raw ? children : <div className={bodyStyle}>{children}</div>}
        {footer && <div className={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}
