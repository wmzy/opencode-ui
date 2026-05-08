import { css, cx } from '@linaria/core';
import { useState, type ReactNode } from 'react';
import { Dialog } from '../dialog/dialog';
import { SettingsGeneral } from './settings-general';
import { SettingsKeybinds } from './settings-keybinds';
import { SettingsProviders } from './settings-providers';
import { SettingsModels } from './settings-models';

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

type SettingsTab = {
  id: string;
  label: string;
  icon: string;
  section?: string;
};

const TABS: SettingsTab[] = [
  { id: 'general', label: 'General', icon: '⚙', section: 'Desktop' },
  { id: 'keybinds', label: 'Shortcuts', icon: '⌨', section: 'Desktop' },
  { id: 'providers', label: 'Providers', icon: '🔌', section: 'Server' },
  { id: 'models', label: 'Models', icon: '🤖', section: 'Server' },
];

export type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general');

  const tabsBySection = TABS.reduce<Record<string, SettingsTab[]>>((acc, tab) => {
    const section = tab.section ?? 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(tab);
    return acc;
  }, {});

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralPlaceholder />;
      case 'keybinds':
        return <KeybindsPlaceholder />;
      case 'providers':
        return <ProvidersPlaceholder />;
      case 'models':
        return <ModelsPlaceholder />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className={settingsDialogStyle} raw>
      <div className={settingsContentStyle}>
        <div className={sidebarStyle}>
          <div className={sidebarSectionStyle}>
            {Object.entries(tabsBySection).map(([section, tabs]) => (
              <div key={section} className={sidebarSectionStyle}>
                <div className={sectionTitleStyle}>{section}</div>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={tabTriggerStyle}
                    data-active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
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
        <div className={contentAreaStyle}>{renderContent()}</div>
      </div>
    </Dialog>
  );
}

function GeneralPlaceholder() {
  return <SettingsGeneral />;
}

function KeybindsPlaceholder() {
  return <SettingsKeybinds />;
}

function ProvidersPlaceholder() {
  return <SettingsProviders />;
}

function ModelsPlaceholder() {
  return <SettingsModels />;
}

export { SettingsGeneral } from './settings-general';
export { SettingsKeybinds } from './settings-keybinds';
export { SettingsProviders } from './settings-providers';
export { SettingsModels } from './settings-models';
