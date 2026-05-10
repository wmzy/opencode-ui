import { css, cx } from '@linaria/core';
import type { CSSProperties, ReactNode, UIEventHandler } from 'react';
import { useRef, useCallback } from 'react';

const scrollAreaStyle = css`
  overflow: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-focus);
  }
`;

const autoHideStyle = css`
  &::-webkit-scrollbar-thumb {
    background: transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: var(--color-border);
  }
`;

export type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  autoHideScrollbar?: boolean;
  onScroll?: UIEventHandler;
};

export function ScrollArea({
  children,
  className,
  style,
  autoHideScrollbar = false,
  onScroll,
}: ScrollAreaProps) {
  return (
    <div
      className={cx(scrollAreaStyle, autoHideScrollbar ? autoHideStyle : undefined, className)}
      style={style}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}

export type VirtualScrollAreaProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  autoHideScrollbar?: boolean;
  onScrollBottom?: () => void;
  onScroll?: UIEventHandler;
};

export function VirtualScrollArea({
  children,
  className,
  style,
  autoHideScrollbar = false,
  onScrollBottom,
  onScroll,
}: VirtualScrollAreaProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll?.(e);
      if (!onScrollBottom || !ref.current) return;
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        onScrollBottom();
      }
    },
    [onScroll, onScrollBottom],
  );

  return (
    <div
      ref={ref}
      className={cx(scrollAreaStyle, autoHideScrollbar ? autoHideStyle : undefined, className)}
      style={style}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
}
