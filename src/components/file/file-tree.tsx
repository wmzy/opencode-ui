import { useState, useCallback, useMemo } from 'react';
import { useFileTree } from '@/context/file';
import { FileIcon } from './file-icon';
import type { FileNode, FileChange } from '@/types/file';

type GitStatusKind = 'M' | 'A' | 'D' | 'U';

function getGitKind(path: string, changes: FileChange[]): GitStatusKind | null {
  for (const change of changes) {
    if (change.path === path) {
      if (change.status === 'modified') return 'M';
      if (change.status === 'added') return 'A';
      if (change.status === 'deleted') return 'D';
      return 'U';
    }
  }
  return null;
}

function KindBadge({ kind }: { kind: GitStatusKind }) {
  const colors: Record<GitStatusKind, string> = {
    M: '#e2b340',
    A: '#3fb950',
    D: '#f85149',
    U: '#8b949e',
  };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: colors[kind],
        width: 14,
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      {kind}
    </span>
  );
}

function TreeNode({
  node,
  level,
  activePath,
  gitStatus,
  onFileClick,
}: {
  node: FileNode;
  level: number;
  activePath?: string;
  gitStatus: FileChange[];
  onFileClick?: (node: FileNode) => void;
}) {
  const { tree } = useFileTree();
  const [expanded, setExpanded] = useState(false);

  const kind = getGitKind(node.path, gitStatus);
  const isActive = node.path === activePath;

  const handleClick = useCallback(() => {
    if (node.type === 'directory') {
      const next = !expanded;
      setExpanded(next);
      if (next) {
        tree.expand(node.path);
      } else {
        tree.collapse(node.path);
      }
    } else {
      onFileClick?.(node);
    }
  }, [node, expanded, tree, onFileClick]);

  const dirState = tree.state(node.path);
  const children = expanded ? tree.children(node.path) : [];
  const isLoading = node.type === 'directory' && expanded && dirState.loading;

  const paddingLeft = 8 + level * 12;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingLeft,
          paddingRight: 8,
          height: 26,
          cursor: 'pointer',
          borderRadius: 4,
          backgroundColor: isActive ? 'var(--color-active, rgba(56,139,253,0.15))' : 'transparent',
          fontSize: 13,
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            ;(e.currentTarget as HTMLDivElement).style.backgroundColor =
              'var(--color-hover, rgba(255,255,255,0.05))';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
          }
        }}
      >
        {node.type === 'directory' && (
          <span
            style={{
              fontSize: 10,
              width: 14,
              textAlign: 'center',
              flexShrink: 0,
              transition: 'transform 0.15s',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            ▶
          </span>
        )}
        {node.type === 'file' && <span style={{ width: 14, flexShrink: 0 }} />}
        <FileIcon node={node} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: node.ignored ? 0.5 : 1,
          }}
        >
          {node.name}
        </span>
        {kind && <KindBadge kind={kind} />}
      </div>
      {isLoading && (
        <div style={{ paddingLeft: paddingLeft + 16, height: 26, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12, opacity: 0.5 }}>Loading...</span>
        </div>
      )}
      {expanded &&
        children.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            level={level + 1}
            activePath={activePath}
            gitStatus={gitStatus}
            onFileClick={onFileClick}
          />
        ))}
    </div>
  );
}

type FileTreeProps = {
  rootPath?: string;
  activePath?: string;
  onFileClick?: (node: FileNode) => void;
  className?: string;
};

export function FileTree({
  rootPath = '.',
  activePath,
  onFileClick,
  className,
}: FileTreeProps) {
  const { tree, gitStatus } = useFileTree();
  const [searchQuery, setSearchQuery] = useState('');

  const rootNodes = useMemo(() => {
    const nodes = tree.children(rootPath);
    if (!searchQuery) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [tree, rootPath, searchQuery]);

  const isEmpty = rootNodes.length === 0 && !searchQuery;
  const noResults = rootNodes.length === 0 && !!searchQuery;
  const dirState = tree.state(rootPath);

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border, #2d333b)' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter files..."
          style={{
            width: '100%',
            background: 'var(--color-input-bg, #161b22)',
            border: '1px solid var(--color-border, #2d333b)',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 12,
            color: 'inherit',
            outline: 'none',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {dirState.loading && !dirState.loaded && (
          <div style={{ padding: '16px 12px', opacity: 0.5, fontSize: 13 }}>
            <span>Loading file tree...</span>
          </div>
        )}
        {isEmpty && !dirState.loading && (
          <div style={{ padding: '16px 12px', opacity: 0.5, fontSize: 13 }}>
            No files found
          </div>
        )}
        {noResults && (
          <div style={{ padding: '16px 12px', opacity: 0.5, fontSize: 13 }}>
            No matching files
          </div>
        )}
        {rootNodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            activePath={activePath}
            gitStatus={gitStatus}
            onFileClick={onFileClick}
          />
        ))}
      </div>
    </div>
  );
}
