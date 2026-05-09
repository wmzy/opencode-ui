import { css } from '@linaria/core';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type KeybindGroup = 'General' | 'Session' | 'Navigation' | 'Model and agent' | 'Terminal' | 'Prompt';

type KeybindEntry = {
  id: string;
  title: string;
  keybind: string;
  group: KeybindGroup;
};

const GROUPS: KeybindGroup[] = ['General', 'Session', 'Navigation', 'Model and agent', 'Terminal', 'Prompt'];

const GROUP_LABELS: Record<KeybindGroup, string> = {
  'General': 'General',
  'Session': 'Session',
  'Navigation': 'Navigation',
  'Model and agent': 'Model and Agent',
  'Terminal': 'Terminal',
  'Prompt': 'Prompt',
};

function groupForId(id: string): KeybindGroup {
  if (id === 'command.palette') return 'General';
  if (id.startsWith('terminal.')) return 'Terminal';
  if (id.startsWith('model.') || id.startsWith('agent.') || id.startsWith('mcp.')) return 'Model and agent';
  if (id.startsWith('file.') || id.startsWith('fileTree.')) return 'Navigation';
  if (id.startsWith('prompt.')) return 'Prompt';
  if (
    id.startsWith('session.') ||
    id.startsWith('message.') ||
    id.startsWith('permissions.') ||
    id.startsWith('steps.') ||
    id.startsWith('review.')
  )
    return 'Session';
  return 'General';
}

function formatKeybind(keybind: string): string {
  if (!keybind || keybind === 'none') return '—';
  return keybind
    .replace(/mod/gi, '⌘')
    .replace(/ctrl/gi, 'Ctrl')
    .replace(/shift/gi, '⇧')
    .replace(/alt/gi, 'Alt')
    .replace(/\+/g, ' ')
    .toUpperCase();
}

const DEFAULT_KEYBINDS: KeybindEntry[] = [
  { id: 'command.palette', title: 'Command Palette', keybind: 'mod+shift+p', group: 'General' },
  { id: 'session.new', title: 'New Session', keybind: 'mod+n', group: 'Session' },
  { id: 'session.delete', title: 'Delete Session', keybind: '', group: 'Session' },
  { id: 'session.history', title: 'Session History', keybind: 'mod+h', group: 'Session' },
  { id: 'settings.open', title: 'Open Settings', keybind: 'mod+,', group: 'General' },
  { id: 'theme.cycle', title: 'Cycle Theme', keybind: 'mod+shift+t', group: 'General' },
  { id: 'model.select', title: 'Select Model', keybind: 'mod+m', group: 'Model and agent' },
  { id: 'agent.cycle', title: 'Cycle Agent', keybind: 'mod+shift+a', group: 'Model and agent' },
  { id: 'prompt.submit', title: 'Submit Prompt', keybind: 'mod+enter', group: 'Prompt' },
  { id: 'prompt.cancel', title: 'Cancel Prompt', keybind: 'escape', group: 'Prompt' },
  { id: 'file.open', title: 'Open File', keybind: 'mod+o', group: 'Navigation' },
  { id: 'fileTree.toggle', title: 'Toggle File Tree', keybind: 'mod+b', group: 'Navigation' },
  { id: 'terminal.toggle', title: 'Toggle Terminal', keybind: 'mod+`', group: 'Terminal' },
];

const IS_MAC = typeof navigator === 'object' && /(Mac|iPod|iPhone|iPad)/.test(navigator.platform);

function isModifier(key: string) {
  return key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta';
}

function normalizeKey(key: string) {
  if (key === ',') return 'comma';
  if (key === '+') return 'plus';
  if (key === ' ') return 'space';
  return key.toLowerCase();
}

function recordKeybind(event: KeyboardEvent): string | undefined {
  if (isModifier(event.key)) return undefined;
  const parts: string[] = [];
  const mod = IS_MAC ? event.metaKey : event.ctrlKey;
  if (mod) parts.push('mod');
  if (IS_MAC && event.ctrlKey) parts.push('ctrl');
  if (!IS_MAC && event.metaKey) parts.push('meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  const key = normalizeKey(event.key);
  if (!key) return undefined;
  parts.push(key);
  return parts.join('+');
}

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 32px 48px;
  max-width: 720px;
`;

const headerRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const titleStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`;

const searchStyle = css`
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 6px 12px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  width: 220px;

  &:focus {
    border-color: var(--color-accent);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const groupStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const groupTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 8px;
`;

const keybindRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const keybindNameStyle = css`
  font-size: 14px;
  color: var(--color-text);
`;

const keybindButtonStyle = css`
  padding: 6px 14px;
  font-size: 12px;
  font-family: var(--haze-font-mono, monospace);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  min-width: 100px;
  text-align: center;

  &:hover {
    border-color: var(--color-border-focus);
  }

  &[data-capturing='true'] {
    border-color: var(--color-accent);
    color: var(--color-accent);
    animation: pulse 1.5s ease infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

const emptyStyle = css`
  text-align: center;
  padding: 48px 16px;
  color: var(--color-text-tertiary);
  font-size: 14px;
`;

export function SettingsKeybinds() {
  const [customKeybinds, setCustomKeybinds] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('opencode-keybinds');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [activeCapture, setActiveCapture] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const resolvedKeybinds = useMemo(() => {
    return DEFAULT_KEYBINDS.map(entry => ({
      ...entry,
      keybind: customKeybinds[entry.id] ?? entry.keybind,
    }));
  }, [customKeybinds]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return resolvedKeybinds;
    const q = filter.toLowerCase();
    return resolvedKeybinds.filter(
      entry =>
        entry.title.toLowerCase().includes(q) ||
        entry.keybind.toLowerCase().includes(q),
    );
  }, [resolvedKeybinds, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, KeybindEntry[]> = {};
    for (const group of GROUPS) map[group] = [];
    for (const entry of filtered) {
      const group = groupForId(entry.id);
      if (!map[group]) map[group] = [];
      map[group].push(entry);
    }
    return map;
  }, [filtered]);

  const hasOverrides = Object.keys(customKeybinds).length > 0;

  const handleKeyCapture = useCallback(
    (event: KeyboardEvent) => {
      if (!activeCapture) return;
      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape') {
        setActiveCapture(null);
        return;
      }

      const isClear =
        (event.key === 'Backspace' || event.key === 'Delete') &&
        !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
      if (isClear) {
        setCustomKeybinds(prev => {
          const next = { ...prev };
          delete next[activeCapture];
          localStorage.setItem('opencode-keybinds', JSON.stringify(next));
          return next;
        });
        setActiveCapture(null);
        return;
      }

      const keybind = recordKeybind(event);
      if (!keybind) return;

      setCustomKeybinds(prev => {
        const next = { ...prev, [activeCapture]: keybind };
        localStorage.setItem('opencode-keybinds', JSON.stringify(next));
        return next;
      });
      setActiveCapture(null);
    },
    [activeCapture],
  );

  useEffect(() => {
    if (activeCapture) {
      document.addEventListener('keydown', handleKeyCapture, true);
      return () => document.removeEventListener('keydown', handleKeyCapture, true);
    }
  }, [activeCapture, handleKeyCapture]);

  const resetAll = () => {
    setCustomKeybinds({});
    localStorage.removeItem('opencode-keybinds');
  };

  const hasResults = GROUPS.some(g => (grouped[g]?.length ?? 0) > 0);

  return (
    <div className={containerStyle}>
      <div className={headerRowStyle}>
        <h2 className={titleStyle}>Keyboard Shortcuts</h2>
        <Button variant="secondary" size="sm" onClick={resetAll} disabled={!hasOverrides}>
          Reset to Defaults
        </Button>
      </div>

      <input
        className={searchStyle}
        type="text"
        placeholder="Search shortcuts..."
        value={filter}
        onChange={e => setFilter(e.currentTarget.value)}
      />

      {GROUPS.map(group => {
        const entries = grouped[group] ?? [];
        if (entries.length === 0) return null;
        return (
          <div key={group} className={groupStyle}>
            <h3 className={groupTitleStyle}>{GROUP_LABELS[group]}</h3>
            {entries.map(entry => (
              <div key={entry.id} className={keybindRowStyle}>
                <span className={keybindNameStyle}>{entry.title}</span>
                <button
                  className={keybindButtonStyle}
                  data-capturing={activeCapture === entry.id}
                  onClick={() => setActiveCapture(prev => (prev === entry.id ? null : entry.id))}
                >
                  {activeCapture === entry.id ? 'Press keys...' : formatKeybind(entry.keybind)}
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {filter && !hasResults && (
        <div className={emptyStyle}>
          No shortcuts matching &quot;{filter}&quot;
        </div>
      )}
    </div>
  );
}
