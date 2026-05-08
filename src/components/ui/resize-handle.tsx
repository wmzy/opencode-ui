import { css, cx } from '@linaria/core';
import type { ReactNode } from 'react';
import { useCallback, useRef } from 'react';

const horizontalStyle = css`
  width: 100%;
  height: 6px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover,
  &:active {
    & > span {
      background: var(--color-accent);
    }
  }
`;

const verticalStyle = css`
  width: 6px;
  height: 100%;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover,
  &:active {
    & > span {
      background: var(--color-accent);
    }
  }
`;

const indicatorHorizontalStyle = css`
  width: 24px;
  height: 2px;
  border-radius: 1px;
  background: var(--color-border-focus);
  transition: background 0.15s;
  pointer-events: none;
`;

const indicatorVerticalStyle = css`
  width: 2px;
  height: 24px;
  border-radius: 1px;
  background: var(--color-border-focus);
  transition: background 0.15s;
  pointer-events: none;
`;

export type ResizeHandleProps = {
  direction?: 'horizontal' | 'vertical';
  onResize?: (delta: number) => void;
  onResizeEnd?: () => void;
  className?: string;
};

export function ResizeHandle({
  direction = 'horizontal',
  onResize,
  onResizeEnd,
  className,
}: ResizeHandleProps) {
  const startPos = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startPos.current = direction === 'horizontal' ? e.clientY : e.clientX;

      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const handleMove = (ev: PointerEvent) => {
        const current = direction === 'horizontal' ? ev.clientY : ev.clientX;
        const delta = current - startPos.current;
        startPos.current = current;
        onResize?.(delta);
      };

      const handleUp = () => {
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        onResizeEnd?.();
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    },
    [direction, onResize, onResizeEnd],
  );

  return (
    <div
      className={cx(
        direction === 'horizontal' ? horizontalStyle : verticalStyle,
        className,
      )}
      onPointerDown={handlePointerDown}
    >
      <span
        className={
          direction === 'horizontal' ? indicatorHorizontalStyle : indicatorVerticalStyle
        }
      />
    </div>
  );
}
