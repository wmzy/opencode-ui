import { useEffect, useState, useRef, useMemo } from 'react';
import { useFileContent } from '@/context/file';

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
        langs: [
          'typescript',
          'javascript',
          'python',
          'bash',
          'json',
          'html',
          'css',
          'tsx',
          'jsx',
          'go',
          'rust',
          'yaml',
          'markdown',
          'sql',
          'diff',
        ],
      });
      return hl;
    } catch {
      return null;
    }
  });
  return highlighterPromise;
}

function langFromPath(path: string): string {
  const name = path.split('/').pop() ?? '';
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'css',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    diff: 'diff',
    patch: 'diff',
  };
  return map[ext] ?? ext;
}

const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'svg',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'mp3',
  'mp4',
  'wav',
  'avi',
  'mov',
  'zip',
  'gz',
  'tar',
  'exe',
  'dll',
  'so',
  'dylib',
  'wasm',
  'pdf',
]);

function isBinaryPath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return BINARY_EXTENSIONS.has(ext);
}

type FileViewerProps = {
  path: string;
  maxHeight?: number;
  onLineClick?: (lineNumber: number) => void;
  className?: string;
};

export function FileViewer({ path, maxHeight = 600, onLineClick, className }: FileViewerProps) {
  const fileState = useFileContent(path);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lang = useMemo(() => langFromPath(path), [path]);
  const binary = isBinaryPath(path);

  useEffect(() => {
    if (!fileState?.content || binary) return;
    const content =
      fileState.content.type === 'text' ? fileState.content.content : '';

    if (!content) {
      setHighlighted('');
      return;
    }

    let cancelled = false;
    getHighlighter().then((hl) => {
      if (cancelled || !hl) return;
      try {
        const html = hl.codeToHtml(content, { lang, theme: 'github-dark' });
        if (!cancelled) setHighlighted(html);
      } catch {
        if (!cancelled) {
          const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          setHighlighted(escaped);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fileState?.content, lang, binary]);

  if (fileState?.loading) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          opacity: 0.5,
          fontSize: 13,
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            height: 14,
            background: 'var(--color-border, #2d333b)',
            borderRadius: 4,
            marginBottom: 8,
            width: '60%',
          }}
        />
        <div
          style={{
            height: 14,
            background: 'var(--color-border, #2d333b)',
            borderRadius: 4,
            marginBottom: 8,
            width: '80%',
          }}
        />
        <div
          style={{
            height: 14,
            background: 'var(--color-border, #2d333b)',
            borderRadius: 4,
            width: '45%',
          }}
        />
      </div>
    );
  }

  if (fileState?.error) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          color: 'var(--color-error, #f85149)',
          fontSize: 13,
        }}
      >
        {fileState.error}
      </div>
    );
  }

  if (binary) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          opacity: 0.5,
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        Binary file: {path.split('/').pop()}
      </div>
    );
  }

  const rawContent = fileState?.content?.content ?? '';
  const sizeBytes = new TextEncoder().encode(rawContent).length;
  const isLarge = sizeBytes > 100_000;

  const lines = rawContent.split('\n');

  return (
    <div
      className={className}
      ref={containerRef}
      style={{
        maxHeight,
        overflow: 'auto',
        fontSize: 13,
        fontFamily: 'monospace',
        lineHeight: 1.5,
      }}
    >
      {isLarge && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(227, 179, 65, 0.15)',
            color: '#e2b340',
            fontSize: 12,
            borderBottom: '1px solid var(--color-border, #2d333b)',
          }}
        >
          Large file ({(sizeBytes / 1024).toFixed(1)} KB) — performance may be affected
        </div>
      )}
      {highlighted !== null ? (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 48,
              textAlign: 'right',
              paddingRight: 8,
              color: 'var(--color-muted, #636e7b)',
              fontSize: 12,
              lineHeight: 1.5,
              userSelect: 'none',
              borderRight: '1px solid var(--color-border, #2d333b)',
            }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                onClick={() => onLineClick?.(i + 1)}
                style={{
                  cursor: onLineClick ? 'pointer' : 'default',
                  height: '1.5em',
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: highlighted }}
            style={{ paddingLeft: 56, overflowX: 'auto' }}
          />
        </div>
      ) : (
        <div style={{ padding: 16, opacity: 0.5 }}>Loading syntax highlighting...</div>
      )}
    </div>
  );
}
