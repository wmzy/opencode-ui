import { useMemo, useState, useEffect } from 'react';

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
        langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'html', 'css', 'tsx', 'jsx', 'go', 'rust', 'yaml', 'markdown', 'sql', 'diff'],
      });
      return hl;
    } catch {
      return null;
    }
  });
  return highlighterPromise;
}

function langFromPath(path: string): string {
  const ext = (path.split('.').pop() ?? '').toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    py: 'python', go: 'go', rs: 'rust', json: 'json', html: 'html',
    css: 'css', scss: 'css', yaml: 'yaml', yml: 'yaml', md: 'markdown',
    sql: 'sql', sh: 'bash', bash: 'bash',
  };
  return map[ext] ?? ext;
}

type DiffLine = {
  type: 'context' | 'add' | 'remove' | 'hunk-header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
};

function parseDiff(patch: string): DiffLine[] {
  const lines = patch.split('\n');
  const result: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      result.push({ type: 'hunk-header', content: line });
    } else if (line.startsWith('+')) {
      result.push({
        type: 'add',
        content: line.slice(1),
        newLineNumber: newLine++,
      });
    } else if (line.startsWith('-')) {
      result.push({
        type: 'remove',
        content: line.slice(1),
        oldLineNumber: oldLine++,
      });
    } else if (line.startsWith(' ')) {
      result.push({
        type: 'context',
        content: line.slice(1),
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
      });
    } else if (line.match(/^\d/)) {
      continue;
    }
  }

  return result;
}

type CollapsedGroup = {
  startIndex: number;
  endIndex: number;
  hiddenCount: number;
};

function computeCollapsedGroups(
  lines: DiffLine[],
  contextLines: number,
): { visibleLines: DiffLine[]; groups: CollapsedGroup[] } {
  if (lines.length <= contextLines * 4 + 5) {
    return { visibleLines: lines, groups: [] };
  }

  const visible: DiffLine[] = [];
  const groups: CollapsedGroup[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].type === 'hunk-header') {
      visible.push(lines[i]);
      i++;
      continue;
    }

    let lastChange = i - 1;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].type !== 'context') {
        lastChange = j;
      }
    }

    if (lastChange < i) {
      for (let j = i; j < lines.length; j++) {
        visible.push(lines[j]);
      }
      break;
    }

    if (lastChange - i > contextLines * 2 + 3) {
      for (let j = 0; j < contextLines && i + j < lines.length; j++) {
        visible.push(lines[i + j]);
      }

      const groupStart = i + contextLines;
      const groupEnd = lastChange - contextLines;
      if (groupEnd <= groupStart) {
        for (let j = i; j < lines.length && j <= lastChange; j++) {
          visible.push(lines[j]);
        }
        i = lastChange + 1;
        continue;
      }

      groups.push({
        startIndex: visible.length,
        endIndex: visible.length,
        hiddenCount: groupEnd - groupStart,
      });

      for (let j = groupEnd; j <= lastChange; j++) {
        visible.push(lines[j]);
      }
      i = lastChange + 1;
    } else {
      for (let j = i; j <= lastChange; j++) {
        visible.push(lines[j]);
      }
      i = lastChange + 1;
    }
  }

  return { visibleLines: visible, groups };
}

type DiffViewerProps = {
  patch: string;
  filePath?: string;
  showHeader?: boolean;
  collapsible?: boolean;
  className?: string;
};

export function DiffViewer({ patch, filePath, showHeader = true, collapsible = true, className }: DiffViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<Record<number, string>>({});

  const parsedLines = useMemo(() => parseDiff(patch), [patch]);

  const { visibleLines, groups } = useMemo(() => {
    if (!collapsible || expanded) {
      return { visibleLines: parsedLines, groups: [] };
    }
    return computeCollapsedGroups(parsedLines, 3);
  }, [parsedLines, collapsible, expanded]);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((hl) => {
      if (!hl || cancelled) return;
      const lang = filePath ? langFromPath(filePath) : 'typescript';
      const result: Record<number, string> = {};
      visibleLines.forEach((line, idx) => {
        if (line.type === 'context' || line.type === 'add' || line.type === 'remove') {
          try {
            result[idx] = hl.codeToHtml(line.content || ' ', { lang, theme: 'github-dark' });
          } catch {
            result[idx] = line.content
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          }
        }
      });
      if (!cancelled) setHighlightedLines(result);
    });
    return () => {
      cancelled = true;
    };
  }, [visibleLines, filePath]);

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    for (const line of parsedLines) {
      if (line.type === 'add') additions++;
      if (line.type === 'remove') deletions++;
    }
    return { additions, deletions };
  }, [parsedLines]);

  const bgColors = {
    'add': 'rgba(63, 185, 80, 0.15)',
    'remove': 'rgba(248, 81, 73, 0.15)',
    'context': 'transparent',
    'hunk-header': 'rgba(255,255,255,0.03)',
  };

  const lineColors = {
    'add': 'rgba(63, 185, 80, 0.4)',
    'remove': 'rgba(248, 81, 73, 0.4)',
    'context': 'transparent',
    'hunk-header': 'transparent',
  };

  const gutterBgColors = {
    'add': 'rgba(63, 185, 80, 0.08)',
    'remove': 'rgba(248, 81, 73, 0.08)',
    'context': 'transparent',
    'hunk-header': 'transparent',
  };

  return (
    <div
      className={className}
      style={{
        fontSize: 13,
        fontFamily: 'monospace',
        lineHeight: 1.5,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      {showHeader && filePath && (
        <div
          style={{
            padding: '6px 12px',
            background: 'var(--color-header-bg, rgba(255,255,255,0.03))',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
          }}
        >
          <span style={{ opacity: 0.7 }}>{filePath}</span>
          <span style={{ color: 'var(--color-success)' }}>+{stats.additions}</span>
          <span style={{ color: 'var(--color-error)' }}>-{stats.deletions}</span>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        {visibleLines.map((line, idx) => (
          <div key={idx} style={{ display: 'flex' }}>
            {line.type !== 'hunk-header' && (
              <>
                <div
                  style={{
                    width: 48,
                    textAlign: 'right',
                    paddingRight: 8,
                    color: 'var(--color-text-tertiary)',
                    background: gutterBgColors[line.type],
                    borderRight: `2px solid ${lineColors[line.type]}`,
                    fontSize: 12,
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {line.oldLineNumber ?? ''}
                </div>
                <div
                  style={{
                    width: 48,
                    textAlign: 'right',
                    paddingRight: 8,
                    color: 'var(--color-text-tertiary)',
                    background: gutterBgColors[line.type],
                    borderRight: '1px solid var(--color-border)',
                    fontSize: 12,
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {line.newLineNumber ?? ''}
                </div>
              </>
            )}
            <div
              style={{
                flex: 1,
                background: bgColors[line.type],
                padding: line.type === 'hunk-header' ? '2px 12px' : '0 12px',
                color:
                  line.type === 'hunk-header'
                    ? 'var(--color-text-tertiary)'
                    : undefined,
                fontSize: line.type === 'hunk-header' ? 12 : 13,
                minWidth: 0,
              }}
            >
              {line.type === 'hunk-header' ? (
                line.content
              ) : highlightedLines[idx] ? (
                <span dangerouslySetInnerHTML={{ __html: highlightedLines[idx] }} />
              ) : (
                line.content
              )}
            </div>
          </div>
        ))}
        {groups.map((group, idx) => (
          <div
            key={`group-${idx}`}
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded(true);
              }
            }}
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--color-text-tertiary)',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {group.hiddenCount} unchanged lines hidden — click to expand
          </div>
        ))}
      </div>
    </div>
  );
}
