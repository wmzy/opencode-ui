import { css, cx } from '@linaria/core';
import { useNavigate, Outlet, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLayout } from '@/context/layout';
import { useSdk } from '@/context/sdk';
import { useCommands } from '@/context/command';
import { useIsMobile } from '@/hooks';
import { FileProvider } from '@/context/file';
import { SidebarRail } from '@/components/layout/sidebar-rail';
import { SidebarPanel } from '@/components/layout/sidebar-panel';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { CommandPalette } from '@/components/command-palette/command-palette';
import type { Project } from '@/types/project';

const layoutContainer = css`
  display: flex;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-bg);
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
`;

const sidebarWrapper = css`
  display: flex;
  flex-shrink: 0;
  height: 100%;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  transition: width 0.2s ease;

  &.collapsed {
    width: var(--sidebar-rail-width, 56px);
  }

  &.expanded {
    width: var(--sidebar-width, 280px);
  }
`;

const sidebarContent = css`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const mainContent = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

export function LayoutPage() {
  const { layout, toggleSidebar } = useLayout();
  const { client, getSdk } = useSdk();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { registerCommand } = useCommands();
  const { dir } = useParams<{ dir: string }>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    client.project.list()
      .then((data) => {
        if (!cancelled) setProjects(data as Project[]);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const currentPath = useMemo(() => {
    try {
      return dir ? atob(dir) : '';
    } catch {
      return dir ?? '';
    }
  }, [dir]);

  const currentProject = useMemo(() => {
    if (!currentPath) return null;
    return projects.find(p => p.worktree === currentPath) ?? null;
  }, [projects, currentPath]);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const projectSdk = useMemo(() => {
    if (currentPath) return getSdk(currentPath);
    return client;
  }, [client, getSdk, currentPath]);

  useEffect(() => {
    const unregisters: (() => void)[] = [];

    unregisters.push(registerCommand({
      id: 'settings.open',
      label: 'Open Settings',
      group: 'Navigation',
      icon: '⚙',
      shortcut: 'mod+comma',
      action: openSettings,
    }));

    unregisters.push(registerCommand({
      id: 'sidebar.toggle',
      label: 'Toggle Sidebar',
      group: 'View',
      shortcut: 'mod+b',
      action: toggleSidebar,
    }));

    unregisters.push(registerCommand({
      id: 'project.open',
      label: 'Open Project',
      group: 'Project',
      shortcut: 'mod+o',
      action: () => { navigate('/'); },
    }));

    unregisters.push(registerCommand({
      id: 'session.new',
      label: 'New Session',
      group: 'Session',
      shortcut: 'mod+shift+s',
      action: () => { navigate('/session'); },
    }));

    unregisters.push(registerCommand({
      id: 'session.archive',
      label: 'Archive Session',
      group: 'Session',
      shortcut: 'mod+shift+backspace',
      action: () => {
        const currentPath = window.location.pathname;
        const match = currentPath.match(/\/session\/([^/]+)/);
        if (match?.[1]) navigate('/');
      },
    }));

    unregisters.push(registerCommand({
      id: 'input.focus',
      label: 'Focus Input',
      group: 'Navigation',
      shortcut: 'ctrl+l',
      action: () => {
        const input = document.querySelector('textarea');
        input?.focus();
      },
    }));

    return () => unregisters.forEach(fn => fn());
  }, [registerCommand, openSettings, toggleSidebar, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSettings]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  if (isMobile) {
    return (
      <FileProvider directory={currentPath || undefined}>
        <div className={layoutContainer}>
          <MobileNav open={layout.sidebarOpen} onClose={toggleSidebar} onSettings={openSettings} project={currentProject} projects={projects} currentPath={currentPath} projectSdk={projectSdk} />
          <div className={mainContent}>
            <Outlet context={{ activeSessionId: layout.activeSessionId, onToggleSidebar: toggleSidebar }} />
          </div>
          <SettingsDialog open={settingsOpen} onClose={closeSettings} />
          <CommandPalette />
        </div>
      </FileProvider>
    );
  }

  return (
    <FileProvider directory={currentPath || undefined}>
      <div className={layoutContainer}>
        <div className={cx(sidebarWrapper, layout.sidebarOpen ? 'expanded' : 'collapsed')}>
          <div className={sidebarContent}>
            <SidebarRail onSettings={openSettings} />
            {layout.sidebarOpen && <SidebarPanel project={currentProject} directory={currentPath} projectSdk={projectSdk} />}
          </div>
        </div>

        <div className={mainContent}>
          <Outlet context={{ activeSessionId: layout.activeSessionId, onToggleSidebar: toggleSidebar }} />
        </div>
        <SettingsDialog open={settingsOpen} onClose={closeSettings} />
        <CommandPalette />
      </div>
    </FileProvider>
  );
}
