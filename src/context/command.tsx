import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Command = {
  id: string;
  label: string;
  group?: string;
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
};

type CommandContextValue = {
  commands: Command[];
  registerCommand: (command: Command) => () => void;
  executeCommand: (id: string) => void;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
};

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({ children }: { children: ReactNode }) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const registerCommand = useCallback((command: Command) => {
    setCommands(prev => [...prev.filter(c => c.id !== command.id), command]);
    return () => {
      setCommands(prev => prev.filter(c => c.id !== command.id));
    };
  }, []);

  const executeCommand = useCallback(
    (id: string) => {
      const cmd = commands.find(c => c.id === id);
      if (cmd) {
        cmd.action();
        setPaletteOpen(false);
      }
    },
    [commands],
  );

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ctrl+` → terminal toggle
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        const cmd = commands.find(c => c.id === 'terminal.toggle');
        if (cmd) {
          cmd.action();
          return;
        }
      }
      // ctrl+l → focus input
      if (e.ctrlKey && e.key === 'l' && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        const cmd = commands.find(c => c.id === 'input.focus');
        if (cmd) {
          cmd.action();
          return;
        }
      }
      // ctrl+alt+t → new terminal
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        const cmd = commands.find(c => c.id === 'terminal.new');
        if (cmd) {
          cmd.action();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commands]);

  return (
    <CommandContext.Provider
      value={{ commands, registerCommand, executeCommand, paletteOpen, openPalette, closePalette }}
    >
      {children}
    </CommandContext.Provider>
  );
}

export function useCommands() {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error('useCommands must be used within CommandProvider');
  return ctx;
}
