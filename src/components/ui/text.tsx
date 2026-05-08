import { css, cx } from '@linaria/core';
import type { ReactNode, HTMLAttributes } from 'react';

const headingBaseStyle = css`
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  margin: 0;
`;

const h1Style = css`
  font-size: 28px;
  letter-spacing: -0.02em;
`;

const h2Style = css`
  font-size: 22px;
  letter-spacing: -0.01em;
`;

const h3Style = css`
  font-size: 18px;
`;

const h4Style = css`
  font-size: 15px;
`;

const h5Style = css`
  font-size: 13px;
`;

const h6Style = css`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const headingSizeMap = {
  h1: h1Style,
  h2: h2Style,
  h3: h3Style,
  h4: h4Style,
  h5: h5Style,
  h6: h6Style,
} as const;

export type HeadingProps = {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLHeadingElement>;

export function Heading({ as: Tag = 'h2', children, className, ...rest }: HeadingProps) {
  return (
    <Tag className={cx(headingBaseStyle, headingSizeMap[Tag], className)} {...rest}>
      {children}
    </Tag>
  );
}

const textStyle = css`
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
`;

const bodyStyle = css`
  font-size: 14px;
`;

const smallStyle = css`
  font-size: 13px;
`;

const captionStyle = css`
  font-size: 12px;
  color: var(--color-text-secondary);
`;

const textSizeMap = {
  body: bodyStyle,
  small: smallStyle,
  caption: captionStyle,
} as const;

export type TextProps = {
  size?: 'body' | 'small' | 'caption';
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLParagraphElement>;

export function Text({ size = 'body', children, className, ...rest }: TextProps) {
  return (
    <p className={cx(textStyle, textSizeMap[size], className)} {...rest}>
      {children}
    </p>
  );
}

const monoStyle = css`
  font-family: var(--haze-font-mono, 'SF Mono', 'Fira Code', monospace);
  font-size: 13px;
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-text);
`;

export type MonoProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export function Mono({ children, className, ...rest }: MonoProps) {
  return (
    <code className={cx(monoStyle, className)} {...rest}>
      {children}
    </code>
  );
}
