import { css, cx } from '@linaria/core';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { FlatModel } from '@/hooks/use-providers';

const popoverStyle = css`
  position: fixed;
  z-index: 1100;
  width: 300px;
  max-height: 340px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
`;

const searchStyle = css`
  width: 100%;
  padding: 10px 12px;
  padding-left: 32px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const searchIconStyle = css`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
  display: flex;
  align-items: center;
`;

const listStyle = css`
  flex: 1;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
`;

const groupLabelStyle = css`
  padding: 6px 10px 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.1s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const activeItemStyle = css`
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);

  &:hover {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
`;

const modelNameStyle = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const checkStyle = css`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--color-accent);
`;

const emptyStyle = css`
  padding: 20px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-tertiary);
`;

export type ModelSelectorProps = {
  models: FlatModel[];
  currentModel?: { providerID: string; modelID: string };
  onSelect: (model: { providerID: string; modelID: string }) => void;
  onClose: () => void;
  anchorRect?: DOMRect;
};

type GroupedModels = {
  providerName: string;
  providerID: string;
  models: FlatModel[];
};

export function ModelSelectorPopover({
  models,
  currentModel,
  onSelect,
  onClose,
  anchorRect,
}: ModelSelectorProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (listRef.current?.contains(target)) return;
      onClose();
    };
    const timer = setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return models;
    const q = query.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.name.toLowerCase().includes(q),
    );
  }, [models, query]);

  const groups = useMemo<GroupedModels[]>(() => {
    const map = new Map<string, GroupedModels>();
    for (const model of filtered) {
      const key = model.provider.id;
      if (!map.has(key)) {
        map.set(key, {
          providerName: model.provider.name,
          providerID: model.provider.id,
          models: [],
        });
      }
      map.get(key)!.models.push(model);
    }
    return [...map.values()];
  }, [filtered]);

  const handleSelect = useCallback(
    (model: FlatModel) => {
      onSelect({ providerID: model.provider.id, modelID: model.id });
      onClose();
    },
    [onSelect, onClose],
  );

  const position = anchorRect
    ? {
        bottom: window.innerHeight - anchorRect.top + 4,
        left: anchorRect.left,
      }
    : { bottom: '100%', left: 0 };

  return (
    <div className={popoverStyle} style={position} ref={listRef}>
      <div style={{ position: 'relative' }}>
        <span className={searchIconStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          ref={searchRef}
          className={searchStyle}
          type="text"
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className={listStyle}>
        {groups.length === 0 && <div className={emptyStyle}>No models found</div>}
        {groups.map((group) => (
          <div key={group.providerID}>
            <div className={groupLabelStyle}>{group.providerName}</div>
            {group.models.map((model) => {
              const isActive =
                currentModel?.providerID === model.provider.id && currentModel?.modelID === model.id;
              return (
                <div
                  key={`${model.provider.id}:${model.id}`}
                  className={cx(itemStyle, isActive && activeItemStyle)}
                  onClick={() => handleSelect(model)}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className={modelNameStyle}>{model.name}</span>
                  {isActive && (
                    <span className={checkStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
