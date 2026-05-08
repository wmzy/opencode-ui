import { css, cx } from '@linaria/core';
import { Card as HazeCard } from 'haze-ui';
import type { ReactNode } from 'react';

const cardStyle = css`
  border-radius: 8px;
  overflow: hidden;
`;

const hoverableStyle = css`
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--color-border-focus);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

export type CardProps = {
  variant?: 'elevated' | 'outlined' | 'filled';
  hoverable?: boolean;
  children: ReactNode;
  className?: string;
};

export function Card({
  variant = 'outlined',
  hoverable = false,
  children,
  className,
}: CardProps) {
  return (
    <HazeCard
      variant={variant}
      className={cx(cardStyle, hoverable ? hoverableStyle : undefined, className)}
    >
      {children}
    </HazeCard>
  );
}

const headerStyle = css`
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
`;

export type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cx(headerStyle, className)}>{children}</div>;
}

const titleStyle = css`
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
`;

export type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export function CardTitle({ children, className }: CardTitleProps) {
  <h3 className={cx(titleStyle, className)}>{children}</h3>;
  return <h3 className={cx(titleStyle, className)}>{children}</h3>;
}

const descriptionStyle = css`
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
`;

export type CardDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cx(descriptionStyle, className)}>{children}</p>;
}

const bodyStyle = css`
  padding: 20px;
`;

export type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cx(bodyStyle, className)}>{children}</div>;
}

const footerStyle = css`
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
`;

export type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cx(footerStyle, className)}>{children}</div>;
}
