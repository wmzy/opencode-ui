import { css, cx } from '@linaria/core';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { IconButton } from '@/components/ui/icon-button';
import { CodeBlock } from './code-block';

const renderer = new marked.Renderer();

renderer.heading = function ({ text, depth }) {
  const slug = text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `<h${depth} id="${slug}">${text}</h${depth}>`;
};

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
} | {
  type: 'mermaid';
  code: string;
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
      type: match[1] === 'mermaid' ? 'mermaid' : 'code',
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

const mermaidStyle = css`
  margin: 8px 0;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow-x: auto;
  text-align: center;

  svg {
    max-width: 100%;
    height: auto;
  }
`;

const mermaidErrorStyle = css`
  margin: 8px 0;
  padding: 12px 16px;
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 13px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
`;

/* ── Mermaid container with fullscreen & zoom support ── */

const mermaidContainerStyle = css`
  position: relative;
  overflow: hidden;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin: 8px 0;
  text-align: center;

  &:fullscreen {
    background: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    width: 100vw;
    height: 100vh;
  }
`;

const mermaidViewportStyle = css`
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  width: 100%;
`;

const mermaidTransformStyle = css`
  line-height: 0;
  will-change: transform;
`;

const mermaidToolbarStyle = css`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
  pointer-events: auto;
`;

const mermaidToolbarVisibleStyle = css`
  opacity: 1;
`;

const mermaidZoomBadgeStyle = css`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 10;
  font-family: monospace;
  letter-spacing: 0.5px;
`;

/* ── SVG icon components ── */

const iconStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

function FullscreenIcon() {
  return (
    <span className={iconStyle}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    </span>
  );
}

function FullscreenExitIcon() {
  return (
    <span className={iconStyle}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
      </svg>
    </span>
  );
}

function ZoomInIcon() {
  return (
    <span className={iconStyle}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    </span>
  );
}

function ZoomOutIcon() {
  return (
    <span className={iconStyle}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    </span>
  );
}

function ResetZoomIcon() {
  return (
    <span className={iconStyle}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </span>
  );
}

/* ── MermaidDiagram component ── */

let mermaidIdCounter = 0;

type MermaidDiagramProps = {
  code: string;
};

function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userScale, setUserScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hovered, setHovered] = useState(false);

  const idRef = useRef(`mermaid-${++mermaidIdCounter}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const svgMetaRef = useRef<{ width: number; height: number } | null>(null);

  /* ── Fullscreen ── */
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        setUserScale(1);
        setPan({ x: 0, y: 0 });
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // user gesture may be missing
    }
  }, []);

  /* ── Mermaid render ── */
  const renderMermaid = useCallback(async () => {
    try {
      const mermaid = await import('mermaid');
      const m = mermaid.default;
      m.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
      });
      const { svg: renderedSvg } = await m.render(idRef.current, code);

      /* ── Extract original SVG dimensions ── */
      const sw = renderedSvg.match(/width="(\d+(?:\.\d+)?)"/);
      const sh = renderedSvg.match(/height="(\d+(?:\.\d+)?)"/);
      if (sw && sh) {
        svgMetaRef.current = {
          width: parseFloat(sw[1]),
          height: parseFloat(sh[1]),
        };
      }

      setSvg(renderedSvg);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSvg(null);
    }
  }, [code]);

  useEffect(() => {
    renderMermaid();
  }, [renderMermaid]);

  /* ── SVG dimension-based zoom ── */

  // In fullscreen, auto-fit the diagram to fill ~92% of viewport (minus padding)
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    if (!isFullscreen) {
      setFitScale(1);
      return;
    }
    const updateFit = () => {
      const meta = svgMetaRef.current;
      if (!meta) return;
      const availW = window.innerWidth - 80;   // 40px padding each side
      const availH = window.innerHeight - 80;
      const fs = Math.min(
        (availW * 0.92) / meta.width,
        (availH * 0.92) / meta.height,
      );
      setFitScale(Math.max(fs, 0.5));
    };
    updateFit();
    window.addEventListener('resize', updateFit);
    return () => window.removeEventListener('resize', updateFit);
  }, [isFullscreen]);

  // Display scale = fit-to-screen × user zoom
  const displayScale = fitScale * userScale;

  // Build zoomed SVG by adjusting width/height attributes (keeps vector crisp)
  const zoomedSvg = useMemo(() => {
    if (!svg || !svgMetaRef.current) return svg ?? '';
    const { width, height } = svgMetaRef.current;
    const newW = width * displayScale;
    const newH = height * displayScale;
    return svg
      .replace(/width="([^"]+)"/, `width="${newW}"`)
      .replace(/height="([^"]+)"/, `height="${newH}"`);
  }, [svg, displayScale]);

  /* ── Zoom & Pan ── */
  const clampScale = (s: number) => Math.max(0.3, Math.min(20, s));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setUserScale((s) => clampScale(s + delta));
  }, []);

  const canPan = displayScale > fitScale * 1.05;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (canPan) {
        setIsPanning(true);
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [canPan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !lastMouseRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    lastMouseRef.current = null;
  }, []);

  const zoomIn = useCallback(() => setUserScale((s) => clampScale(s + 0.3)), []);
  const zoomOut = useCallback(() => setUserScale((s) => clampScale(s - 0.3)), []);
  const resetZoom = useCallback(() => {
    setUserScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  /* ── reset zoom when diagram changes ── */
  useEffect(() => {
    if (svg) {
      setUserScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [svg]);

  /* ── derived state ── */
  const isZoomed = displayScale !== fitScale;
  const toolbarVisible = hovered || isFullscreen;

  /* ── loading / error states ── */
  if (error) {
    return (
      <div className={mermaidErrorStyle}>
        Mermaid render error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={mermaidStyle} style={{ opacity: 0.5, fontSize: 13 }}>
        Rendering diagram...
      </div>
    );
  }

  /* ── normal render ── */
  return (
    <div
      ref={containerRef}
      className={mermaidContainerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        handleMouseUp();
      }}
    >
      <div
        className={mermaidViewportStyle}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Pan layer: only translate, never scale — keeps SVG vector-crisp */}
        <div
          className={mermaidTransformStyle}
          style={{
            transform: canPan ? `translate(${pan.x}px, ${pan.y}px)` : undefined,
            cursor: isPanning ? 'grabbing' : canPan ? 'grab' : 'default',
          }}
          dangerouslySetInnerHTML={{ __html: zoomedSvg }}
        />
      </div>

      <div
        className={cx(mermaidToolbarStyle, toolbarVisible ? mermaidToolbarVisibleStyle : undefined)}
        onWheel={(e) => e.stopPropagation()}
      >
        <IconButton size="sm" tooltip="放大" onClick={zoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton size="sm" tooltip="缩小" onClick={zoomOut}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton size="sm" tooltip="重置缩放" onClick={resetZoom}>
          <ResetZoomIcon />
        </IconButton>
        <IconButton size="sm" tooltip={isFullscreen ? '退出全屏' : '全屏'} onClick={toggleFullscreen}>
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </div>

      {isZoomed && (
        <div className={mermaidZoomBadgeStyle}>
          {Math.round(userScale * 100)}%
        </div>
      )}
    </div>
  );
}

export type MarkdownRendererProps = {
  text: string;
  streaming?: boolean;
  className?: string;
  basePath?: string;
  onFileLinkClick?: (path: string) => void;
};

export function MarkdownRenderer({ text, className, basePath, onFileLinkClick }: MarkdownRendererProps) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  const [highlightedCode, setHighlightedCode] = useState<Record<number, string>>({});
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    e.preventDefault();

    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      const container = containerRef.current;
      if (!container) return;
      const el = container.querySelector(`[id="${CSS.escape(id)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (onFileLinkClick && basePath) {
      try {
        let resolved: string;
        const decodedHref = decodeURIComponent(href);
        if (decodedHref.startsWith('/') || decodedHref.startsWith('http://') || decodedHref.startsWith('https://')) {
          resolved = decodedHref;
        } else {
          const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
          const parts = baseDir ? `${baseDir}/${decodedHref}`.split('/') : decodedHref.split('/');
          const stack: string[] = [];
          for (const part of parts) {
            if (part === '..') {
              stack.pop();
            } else if (part !== '.' && part !== '') {
              stack.push(part);
            }
          }
          resolved = stack.join('/');
        }
        onFileLinkClick(resolved);
      } catch {
        // ignore
      }
    }
  }, [basePath, onFileLinkClick]);

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
    <div className={cx(markdownStyle, className)} ref={containerRef} onClick={handleClick}>
      {blocks.map((block, i) => {
        if (block.type === 'mermaid') {
          return <MermaidDiagram key={i} code={block.code} />;
        }
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
