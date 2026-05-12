import { css } from '@linaria/core';
import { useState, type ReactNode } from 'react';
import { Dialog } from '../dialog/dialog';
import { Collapsible } from '../ui/collapsible';
import { useIsMobile } from '@/hooks/use-media-query';
import { useI18n } from '@/context/language';
import { SettingsGeneral } from './settings-general';
import { SettingsKeybinds } from './settings-keybinds';
import { SettingsProviders } from './settings-providers';
import { SettingsModels } from './settings-models';
import { SettingsServers } from './settings-servers';

const settingsDialogStyle = css`
  max-width: 860px;
  height: calc(100vh - 80px);
  max-height: 700px;
  position: relative;
`;

const settingsContentStyle = css`
  display: flex;
  height: 100%;
  overflow: hidden;
  padding: 0;
`;

const sidebarStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 180px;
  min-width: 180px;
  padding: 12px 8px;
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
`;

const sidebarSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const sectionTitleStyle = css`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
`;

const tabTriggerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: none;
  border: none;
  text-align: left;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  &[data-active='true'] {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const contentAreaStyle = css`
  flex: 1;
  overflow-y: auto;
  min-width: 0;
`;

const versionStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 8px 12px;
  line-height: 1.5;
`;

const mobileDialogStyle = css`
  max-width: 860px;
  width: calc(100vw - 16px);
  height: calc(100vh - 40px);
  max-height: none;
  position: relative;
  overflow: hidden;
`;

const accordionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
  height: 100%;
  -webkit-overflow-scrolling: touch;
`;

type SettingsTab = {
  id: string;
  labelKey: string;
  icon: string;
  sectionKey: string;
  content: ReactNode;
};

const TABS: SettingsTab[] = [
  { id: 'general', labelKey: 'settings.tab.general', icon: '⚙', sectionKey: 'settings.section.desktop', content: <SettingsGeneral /> },
  { id: 'keybinds', labelKey: 'settings.tab.shortcuts', icon: '⌨', sectionKey: 'settings.section.desktop', content: <SettingsKeybinds /> },
  { id: 'servers', labelKey: 'settings.tab.servers', icon: '🌐', sectionKey: 'settings.section.server', content: <SettingsServers /> },
  { id: 'providers', labelKey: 'settings.tab.providers', icon: '🔌', sectionKey: 'settings.section.server', content: <SettingsProviders /> },
  { id: 'models', labelKey: 'settings.tab.models', icon: '🤖', sectionKey: 'settings.section.server', content: <SettingsModels /> },
];

export type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const isMobile = useIsMobile();
  const { t } = useI18n();

  if (isMobile) {
    return (
      <Dialog open={open} onClose={onClose} className={mobileDialogStyle} raw>
        <div className={accordionStyle}>
          {TABS.map(tab => (
            <Collapsible
              key={tab.id}
              trigger={
                <span>{tab.icon} {t(tab.labelKey)}</span>
              }
            >
              {tab.content}
            </Collapsible>
          ))}
        </div>
      </Dialog>
    );
  }

  return <DesktopSettings open={open} onClose={onClose} />;
}

function DesktopSettings({ open, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useI18n();

  const tabsBySection = TABS.reduce<Record<string, SettingsTab[]>>((acc, tab) => {
    const section = tab.sectionKey ?? 'settings.section.desktop';
    if (!acc[section]) acc[section] = [];
    acc[section].push(tab);
    return acc;
  }, {});

  const activeContent = TABS.find(t => t.id === activeTab)?.content ?? null;

  return (
    <Dialog open={open} onClose={onClose} className={settingsDialogStyle} raw>
      <div className={settingsContentStyle}>
        <div className={sidebarStyle}>
          <div className={sidebarSectionStyle}>
            {Object.entries(tabsBySection).map(([section, tabs]) => (
              <div key={section} className={sidebarSectionStyle}>
                <div className={sectionTitleStyle}>{t(section)}</div>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={tabTriggerStyle}
                    data-active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.icon}</span>
                    {t(tab.labelKey)}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className={versionStyle}>
            OpenCode UI<br />
            v0.1.0
          </div>
        </div>
        <div className={contentAreaStyle}>{activeContent}</div>
      </div>
    </Dialog>
  );
}

export { SettingsGeneral } from './settings-general';
export { SettingsKeybinds } from './settings-keybinds';
export { SettingsServers } from './settings-servers';
export { SettingsProviders } from './settings-providers';
export { SettingsModels } from './settings-models';
