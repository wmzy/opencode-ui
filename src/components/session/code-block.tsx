import { css, cx } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from '@/context/language';

const wrapperStyle = css`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;
  border: 1px solid var(--color-border);
  max-width: 100%;
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  font-size: 12px;
  color: var(--color-text-tertiary);
`;

const langLabelStyle = css`
  font-weight: 500;
  text-transform: lowercase;
`;

const copyBtnStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
  }
`;

const copiedStyle = css`
  color: var(--color-success);
`;

const codeContainerStyle = css`
  overflow-x: auto;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;

  & pre {
    margin: 0;
    padding: 0;
    background: transparent;
    font-size: inherit;
  }

  & code {
    font-family: var(--haze-font-mono, 'SF Mono', 'Fira Code', monospace);
    font-size: inherit;
  }
`;

const lineNumbersStyle = css`
  counter-reset: line;
  padding-left: 0;

  & > .code-line {
    counter-increment: line;
    display: block;
    padding-left: 3em;
    position: relative;
    min-height: 1.6em;
  }

  & > .code-line::before {
    content: counter(line);
    position: absolute;
    left: 0;
    width: 2.5em;
    text-align: right;
    color: var(--color-text-tertiary);
    opacity: 0.4;
    font-size: 12px;
    user-select: none;
  }
`;

const expandBtnStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border);
  cursor: pointer;
  width: 100%;
  font-family: inherit;

  &:hover {
    color: var(--color-text-secondary);
  }
`;

const collapsedStyle = css`
  max-height: 300px;
  overflow: hidden;
`;

const COLLAPSE_THRESHOLD = 15;

export type CodeBlockProps = {
  code: string;
  language?: string;
  html?: string;
  showLineNumbers?: boolean;
  className?: string;
};

export function CodeBlock({
  code,
  language,
  html,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const lines = code.split('\n');
  const isLong = lines.length > COLLAPSE_THRESHOLD;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={cx(wrapperStyle, className)}>
      <div className={headerStyle}>
        <span className={langLabelStyle}>{language ?? 'text'}</span>
        <button className={cx(copyBtnStyle, copied && copiedStyle)} onClick={handleCopy}>
          {copied ? t('message.copied') : t('message.copy')}
        </button>
      </div>
      <div
        className={cx(
          codeContainerStyle,
          showLineNumbers && lineNumbersStyle,
          isLong && !expanded && collapsedStyle,
        )}
      >
        {html ? (
          <pre>
            <code dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        ) : (
          <pre>
            <code>{code}</code>
          </pre>
        )}
      </div>
      {isLong && (
        <button className={expandBtnStyle} onClick={() => setExpanded((e) => !e)}>
          {expanded ? t('session.collapse') : t('session.show_all_lines', { count: lines.length })}
        </button>
      )}
    </div>
  );
}
