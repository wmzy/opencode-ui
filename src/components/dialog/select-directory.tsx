import { css } from '@linaria/core';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog } from './dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/context/language';
import { useSdk } from '@/context/sdk';

function normalizePath(input: string) {
  const v = input.replaceAll('\\', '/');
  if (v.startsWith('//') && !v.startsWith('///')) return `//${v.slice(2).replace(/\/+/g, '/')}`;
  return v.replace(/\/+/g, '/');
}

function trimTrailing(input: string) {
  const v = normalizePath(input);
  if (v === '/') return v;
  if (v === '//') return v;
  if (/^[A-Za-z]:\/$/.test(v)) return v;
  return v.replace(/\/+$/, '');
}

function getFilename(input: string) {
  const v = trimTrailing(input);
  const i = v.lastIndexOf('/');
  if (i < 0) return v;
  return v.slice(i + 1);
}

function getDirectory(input: string) {
  const v = trimTrailing(input);
  const i = v.lastIndexOf('/');
  if (i <= 0) return '/';
  return v.slice(0, i);
}

function tildeOf(absolute: string, home: string) {
  const full = trimTrailing(absolute);
  if (!home) return '';
  const hn = trimTrailing(home);
  const lc = full.toLowerCase();
  const hc = hn.toLowerCase();
  if (lc === hc) return '~';
  if (lc.startsWith(`${hc}/`)) return `~${full.slice(hn.length)}`;
  return '';
}

function displayPath(path: string, home: string) {
  return tildeOf(path, home) || path;
}

function matchesQuery(name: string, query: string) {
  const nl = name.toLowerCase();
  const ql = query.toLowerCase();
  return nl.includes(ql) || ql.includes(nl);
}

type DirRow = {
  absolute: string;
  name: string;
  displayPath: string;
  group: 'recent' | 'folders';
};

type ProjectData = {
  worktree: string;
  name?: string;
};

type PathData = {
  home?: string;
  directory?: string;
};

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 380px;
  overflow-y: auto;
`;

const groupHeaderStyle = css`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  padding: 8px 14px 4px;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &[data-selected='true'] {
    background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  }
`;

const dirNameStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const dirDisplayPathStyle = css`
  display: flex;
  align-items: center;
  font-size: 14px;
  min-width: 0;
  color: var(--color-text-secondary);
  font-family: var(--haze-font-mono, monospace);

  & > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const dimSpanStyle = css`
  color: var(--color-text-tertiary);
`;

const emptyStyle = css`
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-tertiary);
  font-size: 14px;
`;

const searchStyle = css`
  margin-bottom: 12px;
`;

const loadingStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--color-text-tertiary);
  font-size: 14px;
  gap: 8px;
`;

const spinnerStyle = css`
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export type SelectDirectoryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect?: (path: string) => void;
  currentPath?: string;
};

export function SelectDirectoryDialog({ open, onClose, onSelect, currentPath }: SelectDirectoryDialogProps) {
  const { t } = useI18n();
  const { client, getSdk } = useSdk();

  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(currentPath ?? null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DirRow[]>([]);
  const [recentProjects, setRecentProjects] = useState<DirRow[]>([]);
  const [home, setHome] = useState('');

  const searchSeq = useRef(0);

  useEffect(() => {
    if (!open) return;

    setFilter('');
    setSelected(currentPath ?? null);
    setLoading(false);
    setResults([]);
    searchSeq.current++;

    let cancelled = false;

    (async () => {
      try {
        const pathData = await client.path.get() as PathData;
        if (cancelled) return;
        const homePath = pathData?.home ?? '';
        setHome(homePath);

        const projects = await client.project.list() as ProjectData[];
        if (cancelled) return;

        const rows: DirRow[] = projects.slice(0, 5).map((p) => {
          const abs = trimTrailing(p.worktree);
          return {
            absolute: abs,
            name: p.name ?? getFilename(abs),
            displayPath: displayPath(abs, homePath),
            group: 'recent' as const,
          };
        });
        setRecentProjects(rows);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, client, currentPath]);

  useEffect(() => {
    if (!open) return;

    const query = filter.trim();
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const seq = ++searchSeq.current;
    setLoading(true);

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const findSdk = getSdk(home || '/');
        const found = await findSdk.find.file({
          query,
          type: 'directory',
          limit: 50,
        });

        if (cancelled) return;

        const rows: DirRow[] = (found as string[]).map((path) => {
          const abs = trimTrailing(path);
          return {
            absolute: abs,
            name: getFilename(abs),
            displayPath: displayPath(abs, home),
            group: 'folders' as const,
          };
        });

        if (searchSeq.current !== seq) return;

        setResults(rows);
        setLoading(false);
      } catch {
        if (!cancelled && searchSeq.current === seq) {
          setResults([]);
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filter, open, home, getSdk]);

  const handleSelect = useCallback(() => {
    if (selected) {
      onSelect?.(selected);
      onClose();
    }
  }, [selected, onSelect, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && selected) {
        e.preventDefault();
        handleSelect();
      }
    },
    [handleSelect, selected],
  );

  const displayRows = useMemo(() => {
    const query = filter.trim();
    if (!query) {
      return recentProjects;
    }

    const seen = new Set<string>();
    const rows: DirRow[] = [];

    for (const r of recentProjects) {
      if (matchesQuery(r.name, query) || r.absolute.toLowerCase().includes(query.toLowerCase())) {
        if (!seen.has(r.absolute)) {
          seen.add(r.absolute);
          rows.push(r);
        }
      }
    }

    for (const r of results) {
      if (!seen.has(r.absolute)) {
        seen.add(r.absolute);
        rows.push(r);
      }
    }

    return rows;
  }, [filter, recentProjects, results]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: DirRow[] }[] = [];
    const recent = displayRows.filter((r) => r.group === 'recent');
    const folders = displayRows.filter((r) => r.group === 'folders');

    if (recent.length > 0) {
      groups.push({ label: t('directory.recent'), items: recent });
    }
    if (folders.length > 0) {
      groups.push({ label: t('directory.folders'), items: folders });
    }

    return groups;
  }, [displayRows, t]);

  const query = filter.trim();
  const isEmpty = !loading && displayRows.length === 0 && !!query;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('project.open')}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" disabled={!selected} onClick={handleSelect}>
            {t('common.open')}
          </Button>
        </div>
      )}
    >
      <div className={searchStyle}>
        <Input
          autoFocus
          placeholder={t('directory.search_placeholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          size="md"
        />
      </div>

      {loading ? (
        <div className={loadingStyle}>
          <div className={spinnerStyle} />
          {t('common.loading')}
        </div>
      ) : isEmpty ? (
        <div className={emptyStyle}>{t('directory.no_results')}</div>
      ) : !query && recentProjects.length === 0 ? (
        <div className={emptyStyle}>{t('session.no_recent_directories')}</div>
      ) : (
        <div className={listStyle}>
          {grouped.map((group) => (
            <div key={group.label}>
              <div className={groupHeaderStyle}>{group.label}</div>
              {group.items.map((row) => (
                <div
                  key={row.absolute}
                  className={itemStyle}
                  data-selected={selected === row.absolute}
                  onClick={() => setSelected(row.absolute)}
                  onDoubleClick={() => {
                    setSelected(row.absolute);
                    onSelect?.(row.absolute);
                    onClose();
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={dirNameStyle}>{row.name}</div>
                    <div className={dirDisplayPathStyle}>
                      <span className={dimSpanStyle}>
                        {getDirectory(row.displayPath)}
                      </span>
                      <span style={{ flexShrink: 0 }}>{getFilename(row.displayPath)}</span>
                      <span className={dimSpanStyle}>/</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
