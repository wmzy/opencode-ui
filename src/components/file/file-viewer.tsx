import { useEffect, useState, useRef, useMemo } from 'react';
import { useFileContent } from '@/context/file';
import { MarkdownRenderer } from '@/components/session/markdown-renderer';

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

const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'svg',
  'bmp',
  'avif',
]);

const BINARY_EXTENSIONS = new Set([
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

function isImagePath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.has(ext);
}

function isBinaryPath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return BINARY_EXTENSIONS.has(ext);
}

function isMarkdownPath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'md' || ext === 'mdx';
}

type FileViewerProps = {
  path: string;
  maxHeight?: number;
  onLineClick?: (lineNumber: number) => void;
  onFileLinkClick?: (path: string) => void;
  className?: string;
};

export function FileViewer({ path, maxHeight = 600, onLineClick, onFileLinkClick, className }: FileViewerProps) {
  const fileState = useFileContent(path);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lang = useMemo(() => langFromPath(path), [path]);
  const binary = isBinaryPath(path);
  const image = isImagePath(path);
  const markdown = isMarkdownPath(path);

  useEffect(() => {
    if (!fileState?.content || binary || image || markdown) return;
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

  if (image) {
    return (
      <div className={className} style={{ padding: 16, textAlign: 'center' }}>
        <img
          src={path}
          alt={path.split('/').pop() ?? 'image'}
          style={{
            maxWidth: '100%',
            maxHeight: typeof maxHeight === 'number' ? maxHeight : 600,
            borderRadius: 6,
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const parent = (e.currentTarget as HTMLImageElement).parentElement;
            if (parent) parent.textContent = `Image: ${path.split('/').pop()}`;
          }}
        />
      </div>
    );
  }

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
            background: 'var(--color-border)',
            borderRadius: 4,
            marginBottom: 8,
            width: '60%',
          }}
        />
        <div
          style={{
            height: 14,
            background: 'var(--color-border)',
            borderRadius: 4,
            marginBottom: 8,
            width: '80%',
          }}
        />
        <div
          style={{
            height: 14,
            background: 'var(--color-border)',
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
          color: 'var(--color-error)',
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

  if (markdown) {
    const content = fileState?.content?.type === 'text' ? fileState.content.content : '';
    if (fileState?.loading) {
      return (
        <div className={className} style={{ padding: 16, opacity: 0.5, fontSize: 13 }}>
          Loading...
        </div>
      );
    }
    if (!content) return null;
    return (
      <div
        className={className}
        style={{
          maxHeight,
          overflow: 'auto',
          padding: 16,
        }}
      >
        <MarkdownRenderer text={content} basePath={path} onFileLinkClick={onFileLinkClick} />
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
            color: 'var(--color-warning)',
            fontSize: 12,
            borderBottom: '1px solid var(--color-border)',
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
              color: 'var(--color-text-tertiary)',
              fontSize: 12,
              lineHeight: 1.5,
              userSelect: 'none',
              borderRight: '1px solid var(--color-border)',
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
