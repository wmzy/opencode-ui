import { useMemo } from 'react';
import type { FileNode } from '@/types/file';

const EXTENSION_ICONS: Record<string, string> = {
  ts: 'TS',
  tsx: 'TX',
  js: 'JS',
  jsx: 'JX',
  py: 'PY',
  go: 'GO',
  rs: 'RS',
  md: 'MD',
  json: '{ }',
  yaml: 'YL',
  yml: 'YL',
  toml: 'TL',
  css: 'CS',
  scss: 'SS',
  html: 'HT',
  sql: 'DB',
  sh: 'SH',
  bash: 'SH',
  zsh: 'SH',
  dockerfile: 'DK',
  gitignore: 'GI',
  env: 'EV',
  lock: 'LK',
  svg: 'SV',
  png: 'IM',
  jpg: 'IM',
  gif: 'IM',
  webp: 'IM',
  ico: 'IM',
  txt: 'TX',
  xml: 'XM',
  graphql: 'GQ',
  gql: 'GQ',
  vue: 'VU',
  svelte: 'SV',
};

const NAME_ICONS: Record<string, string> = {
  'package.json': 'PKG',
  'tsconfig.json': 'TS',
  'vite.config.ts': 'VT',
  'vite.config.js': 'VT',
  'next.config.ts': 'NX',
  'next.config.js': 'NX',
  'next.config.mjs': 'NX',
  'dockerfile': 'DK',
  'makefile': 'MK',
  'readme': 'RD',
  'license': 'LC',
  'changelog': 'CL',
  '.gitignore': 'GI',
  '.env': 'EV',
  '.env.local': 'EV',
  '.eslintrc': 'ES',
  '.prettierrc': 'PR',
};

type FileIconProps = {
  node: Pick<FileNode, 'name' | 'type'>;
  className?: string;
};

export function FileIcon({ node, className }: FileIconProps) {
  const icon = useMemo(() => {
    if (node.type === 'directory') return '📁';

    const lower = node.name.toLowerCase();

    if (NAME_ICONS[lower]) return NAME_ICONS[lower];

    const dotIdx = node.name.lastIndexOf('.');
    if (dotIdx >= 0) {
      const ext = node.name.slice(dotIdx + 1).toLowerCase();
      if (EXTENSION_ICONS[ext]) return EXTENSION_ICONS[ext];
    }

    return '📄';
  }, [node.name, node.type]);

  const isDir = node.type === 'directory';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        fontSize: isDir ? 12 : 8,
        fontFamily: 'monospace',
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {icon}
    </span>
  );
}
