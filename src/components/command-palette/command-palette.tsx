import { css } from '@linaria/core';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useCommands, type Command } from '@/context/command';

const overlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: min(20vh, 200px);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const paletteStyle = css`
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  width: 520px;
  max-width: calc(100vw - 32px);
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const searchInput = css`
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 15px;
  font-family: inherit;
  outline: none;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const listStyle = css`
  flex: 1;
  overflow-y: auto;
  padding: 4px;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: background 0.1s, color 0.1s;

  &:hover,
  &.selected {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const itemIcon = css`
  width: 20px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
`;

const itemLabel = css`
  flex: 1;
  font-size: 14px;
`;

const itemShortcut = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--haze-font-mono, monospace);
`;

const groupLabel = css`
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const emptyStyle = css`
  padding: 20px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 14px;
`;

export function CommandPalette() {
  const { commands, executeCommand, paletteOpen, closePalette } = useCommands();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    const group = cmd.group ?? 'Commands';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cmd);
    return acc;
  }, {});

  const flatItems = filtered;

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [paletteOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
        e.preventDefault();
        executeCommand(flatItems[selectedIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    },
    [flatItems, selectedIndex, executeCommand, closePalette],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!paletteOpen) return null;

  return (
    <div className={overlayStyle} onClick={closePalette}>
      <div className={paletteStyle} onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <input
          ref={inputRef}
          className={searchInput}
          placeholder="Type a command..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className={listStyle}>
          {flatItems.length === 0 && <div className={emptyStyle}>No commands found</div>}
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group}>
              <div className={groupLabel}>{group}</div>
              {cmds.map(cmd => {
                const idx = flatItems.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`${itemStyle} ${idx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => executeCommand(cmd.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {cmd.icon && <span className={itemIcon}>{cmd.icon}</span>}
                    <span className={itemLabel}>{cmd.label}</span>
                    {cmd.shortcut && <span className={itemShortcut}>{cmd.shortcut}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
