import { css } from '@linaria/core';
import { useState, useRef, useCallback, useEffect } from 'react';

const containerStyle = css`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  border-radius: 16px 16px 0 0;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  touch-action: none;

  &.open {
    transform: translateY(0);
  }
`;

const handleStyle = css`
  display: flex;
  justify-content: center;
  padding: 8px;
  cursor: grab;
`;

const handleBarStyle = css`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border-focus);
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
`;

const titleStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`;

const contentStyle = css`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  padding-bottom: calc(16px + var(--safe-area-bottom));
`;

const backdropStyle = css`
  position: fixed;
  inset: 0;
  z-index: 39;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }
`;

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      currentY.current = diff;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${diff}px)`;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      if (currentY.current > 100) {
        onClose();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div
        className={`${backdropStyle} ${open ? 'visible' : ''}`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`${containerStyle} ${open ? 'open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={handleStyle}>
          <div className={handleBarStyle} />
        </div>
        {title && (
          <div className={headerStyle}>
            <span className={titleStyle}>{title}</span>
          </div>
        )}
        <div className={contentStyle}>{children}</div>
      </div>
    </>
  );
}
