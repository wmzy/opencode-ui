import { css, cx } from '@linaria/core';
import type { TextPart } from '@/types/part';
import { MarkdownRenderer } from './markdown-renderer';

const textStyle = css`
  max-width: 100%;
  overflow-wrap: break-word;
`;

export type MessageTextProps = {
  part: TextPart;
  streaming?: boolean;
  className?: string;
};

export function MessageText({ part, streaming = false, className }: MessageTextProps) {
  const text = part.text?.trim();
  if (!text) return null;

  return (
    <div className={cx(textStyle, className)}>
      <MarkdownRenderer text={text} streaming={streaming} />
    </div>
  );
}
