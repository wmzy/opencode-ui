import { css, cx } from '@linaria/core';
import { useState, type ReactNode } from 'react';
import { Dialog } from '../dialog/dialog';
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
  width: calc(100vw - 16px);
  height: calc(100dvh - 40px);
  max-height: none !important;
  max-width: none !important;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const mobileScrollAreaStyle = css`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  -webkit-overflow-scrolling: touch;

  & > div {
    overflow: visible !important;
  }
`;

const chevronStyle = css`
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
`;

const chevronExpandedStyle = css`
  transform: rotate(180deg);
`;

type SettingsTab = {
  id: string;
  labelKey: string;
  icon: string;
  sectionKey: string;
  Content: () => ReactNode;
};

const TABS: SettingsTab[] = [
  { id: 'general', labelKey: 'settings.tab.general', icon: '⚙', sectionKey: 'settings.section.desktop', Content: SettingsGeneral },
  { id: 'keybinds', labelKey: 'settings.tab.shortcuts', icon: '⌨', sectionKey: 'settings.section.desktop', Content: SettingsKeybinds },
  { id: 'servers', labelKey: 'settings.tab.servers', icon: '🌐', sectionKey: 'settings.section.server', Content: SettingsServers },
  { id: 'providers', labelKey: 'settings.tab.providers', icon: '🔌', sectionKey: 'settings.section.server', Content: SettingsProviders },
  { id: 'models', labelKey: 'settings.tab.models', icon: '🤖', sectionKey: 'settings.section.server', Content: SettingsModels },
];

export type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSettings open={open} onClose={onClose} />;
  }

  return <DesktopSettings open={open} onClose={onClose} />;
}

function MobileSettings({ open, onClose }: SettingsDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onClose={onClose} className={mobileDialogStyle} raw>
      <div className={mobileScrollAreaStyle}>
        {TABS.map(tab => (
          <MobileCollapsible
            key={tab.id}
            label={`${tab.icon} ${t(tab.labelKey)}`}
            defaultExpanded={tab.id === 'general'}
          >
            <tab.Content />
          </MobileCollapsible>
        ))}
      </div>
    </Dialog>
  );
}

const mobileCollapsibleStyle = css`
  border: 1px solid var(--color-border);
  border-radius: 8px;
`;

const mobileCollapsibleTriggerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const mobileCollapsibleContentStyle = css`
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
`;

const mobileCollapsibleHiddenStyle = css`
  display: none;
`;

function MobileCollapsible({ label, defaultExpanded = false, children }: { label: string; defaultExpanded?: boolean; children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={mobileCollapsibleStyle}>
      <button className={mobileCollapsibleTriggerStyle} onClick={() => setIsExpanded(prev => !prev)}>
        {label}
        <svg
          className={cx(chevronStyle, isExpanded && chevronExpandedStyle)}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div className={cx(mobileCollapsibleContentStyle, !isExpanded && mobileCollapsibleHiddenStyle)}>
        {children}
      </div>
    </div>
  );
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

  const ActiveContent = TABS.find(tab => tab.id === activeTab)?.Content;
  if (!ActiveContent) return null;

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
        <div className={contentAreaStyle}><ActiveContent /></div>
      </div>
    </Dialog>
  );
}

export { SettingsGeneral } from './settings-general';
export { SettingsKeybinds } from './settings-keybinds';
export { SettingsServers } from './settings-servers';
export { SettingsProviders } from './settings-providers';
export { SettingsModels } from './settings-models';
