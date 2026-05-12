import { css, cx } from '@linaria/core';
import { useMemo, useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { CodeBlock } from './code-block';

const renderer = new marked.Renderer();

const markdownStyle = css`
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text);
  word-break: break-word;
  max-width: 100%;
  overflow-x: hidden;

  & > *:first-child {
    margin-top: 0;
  }

  & h1, & h2, & h3, & h4, & h5, & h6 {
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 8px;
    line-height: 1.3;
  }

  & h1 { font-size: 1.5em; }
  & h2 { font-size: 1.3em; }
  & h3 { font-size: 1.15em; }
  & h4 { font-size: 1em; }

  & p {
    margin: 8px 0;
  }

  & ul, & ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  & li {
    margin: 4px 0;
  }

  & li > ul, & li > ol {
    margin: 4px 0;
  }

  & blockquote {
    margin: 8px 0;
    padding: 8px 16px;
    border-left: 3px solid var(--color-accent);
    background: var(--color-bg-secondary);
    border-radius: 0 4px 4px 0;
    color: var(--color-text-secondary);
  }

  & hr {
    margin: 16px 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  & a {
    color: var(--color-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  & img {
    max-width: 100%;
    border-radius: 8px;
    margin: 8px 0;
  }

  & table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 13px;
  }

  & th, & td {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & th {
    background: var(--color-bg-secondary);
    font-weight: 600;
  }

  & tr:nth-child(even) {
    background: var(--color-bg-secondary);
  }

  & code:not(pre code) {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.875em;
    background: var(--color-bg-tertiary);
    color: var(--color-accent);
  }

  & pre {
    margin: 8px 0;
  }

  & input[type="checkbox"] {
    margin-right: 6px;
  }

  & strong {
    font-weight: 600;
  }

  & em {
    font-style: italic;
  }
`;

type ParsedBlock = {
  type: 'html';
  content: string;
} | {
  type: 'code';
  code: string;
  language: string;
};

function parseBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const md = text.slice(lastIndex, match.index);
      const html = marked.parse(md, { renderer, async: false }) as string;
      if (html.trim()) {
        blocks.push({ type: 'html', content: html });
      }
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      code: match[2].replace(/\n$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const md = text.slice(lastIndex);
    const html = marked.parse(md, { renderer, async: false }) as string;
    if (html.trim()) {
      blocks.push({ type: 'html', content: html });
    }
  }

  return blocks;
}

type ShikiHighlighter = {
  codeToHtml: (code: string, opts: { lang: string; theme: string }) => string;
};

let highlighterPromise: Promise<ShikiHighlighter | null> | null = null;

function getHighlighter(): Promise<ShikiHighlighter | null> {
  if (highlighterPromise) return highlighterPromise;
  highlighterPromise = import('shiki').then(async (shiki) => {
    try {
      const hl = await shiki.createHighlighter({
        themes: ['github-dark'],
        langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'html', 'css', 'tsx', 'jsx', 'go', 'rust', 'yaml', 'markdown', 'sql'],
      });
      return hl;
    } catch {
      return null;
    }
  });
  return highlighterPromise;
}

export type MarkdownRendererProps = {
  text: string;
  streaming?: boolean;
  className?: string;
};

export function MarkdownRenderer({ text, className }: MarkdownRendererProps) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  const [highlightedCode, setHighlightedCode] = useState<Record<number, string>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const codeBlocks = blocks.filter((b): b is Extract<ParsedBlock, { type: 'code' }> => b.type === 'code');

    if (codeBlocks.length === 0) return;

    getHighlighter().then((hl) => {
      if (!hl || cancelled || !mountedRef.current) return;
      const result: Record<number, string> = {};
      codeBlocks.forEach((block) => {
        const idx = blocks.indexOf(block);
        try {
          result[idx] = hl.codeToHtml(block.code, { lang: block.language ?? 'text', theme: 'github-dark' });
        } catch {
          result[idx] = '';
        }
      });
      if (!cancelled && mountedRef.current) {
        setHighlightedCode((prev) => ({ ...prev, ...result }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [blocks]);

  const textTrimmed = text.trim();
  if (!textTrimmed) return null;

  return (
    <div className={cx(markdownStyle, className)}>
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          const html = highlightedCode[i];
          return (
            <CodeBlock
              key={i}
              code={block.code}
              language={block.language}
              html={html}
              showLineNumbers={block.code.split('\n').length > 3}
            />
          );
        }
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: block.content }} />
        );
      })}
    </div>
  );
}
