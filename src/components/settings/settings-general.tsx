import { css } from '@linaria/core';
import { useState, useEffect, useCallback } from 'react';
import { useTheme, type ColorScheme } from '@/context/theme';
import { useSettings } from '@/context/settings';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSdk } from '@/context/sdk';

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 32px 48px;
  max-width: 720px;
`;

const sectionTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 8px;
`;

const settingsListStyle = css`
  display: flex;
  flex-direction: column;
`;

const settingsRowStyle = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const rowTextStyle = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const rowTitleStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const rowDescStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
`;

const rowControlStyle = css`
  flex-shrink: 0;
`;

const themeGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
`;

const themeCardStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: var(--color-bg-tertiary);

  &:hover {
    border-color: var(--color-border-focus);
  }

  &[data-active='true'] {
    border-color: var(--color-accent);
  }
`;

const themePreviewStyle = css`
  width: 100%;
  height: 40px;
  border-radius: 4px;
  display: flex;
  overflow: hidden;
`;

const themeNameStyle = css`
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const colorSchemeRowStyle = css`
  display: flex;
  gap: 4px;
`;

const schemeButtonStyle = css`
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--color-border-focus);
    color: var(--color-text);
  }

  &[data-active='true'] {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #fff;
  }
`;

const fontRowStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

export function SettingsGeneral() {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  const { client } = useSdk();
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const [shells, setShells] = useState<Array<{ path: string; name: string; acceptable: boolean }>>([]);

  useEffect(() => {
    theme.loadThemes().then(() => {
      setThemeIds(theme.ids());
    });
  }, [theme]);

  const fetchShells = useCallback(async () => {
    try {
      const result = await client.pty.shells();
      setShells(result);
    } catch {
      // intentionally ignored: shells are non-critical
    }
  }, [client]);

  useEffect(() => {
    fetchShells();
  }, [fetchShells]);

  const colorSchemes: { value: ColorScheme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ];

  const shellOptions = [
    { value: '', label: 'Default' },
    ...shells.filter(s => s.acceptable).map(s => ({ value: s.path, label: s.name })),
  ];

  const getThemePreviewColors = (id: string) => {
    const themes = theme.themes();
    const t = themes[id];
    if (!t) return { bg: '#1a1a1a', fg: '#e5e5e5', accent: '#6366f1' };
    const variant = t.dark;
    const pal = variant.palette ?? variant.seeds;
    if (!pal) return { bg: '#1a1a1a', fg: '#e5e5e5', accent: '#6366f1' };
    return {
      bg: pal.neutral,
      fg: pal.primary,
      accent: pal.interactive ?? pal.primary,
    };
  };

  return (
    <div className={containerStyle}>
      <div>
        <h3 className={sectionTitleStyle}>Appearance</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Color Scheme</span>
              <span className={rowDescStyle}>Choose between light and dark mode</span>
            </div>
            <div className={rowControlStyle}>
              <div className={colorSchemeRowStyle}>
                {colorSchemes.map(scheme => (
                  <button
                    key={scheme.value}
                    className={schemeButtonStyle}
                    data-active={theme.colorScheme === scheme.value}
                    onClick={() => theme.setColorScheme(scheme.value)}
                    onMouseEnter={() => theme.previewColorScheme(scheme.value)}
                    onMouseLeave={() => theme.cancelPreview()}
                  >
                    {scheme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Theme</span>
              <span className={rowDescStyle}>Select a color theme for the interface</span>
            </div>
          </div>
          <div className={themeGridStyle}>
            {themeIds.map(id => {
              const colors = getThemePreviewColors(id);
              return (
                <button
                  key={id}
                  className={themeCardStyle}
                  data-active={theme.themeId === id}
                  onClick={() => theme.setTheme(id)}
                  onMouseEnter={() => theme.previewTheme(id)}
                  onMouseLeave={() => theme.cancelPreview()}
                >
                  <div className={themePreviewStyle}>
                    <div style={{ flex: 1, background: colors.bg }} />
                    <div style={{ width: '30%', background: colors.accent }} />
                  </div>
                  <span className={themeNameStyle}>{theme.name(id)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>General</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Language</span>
              <span className={rowDescStyle}>Select interface language</span>
            </div>
            <div className={rowControlStyle}>
              <Select
                options={languageOptions}
                value={settings.language}
                onChange={e => updateSettings({ language: e.currentTarget.value })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Shell</span>
              <span className={rowDescStyle}>Default shell for terminal sessions</span>
            </div>
            <div className={rowControlStyle}>
              <Select
                options={shellOptions}
                value={settings.shell ?? ''}
                onChange={e => updateSettings({ shell: e.currentTarget.value })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Font Size</span>
              <span className={rowDescStyle}>Adjust the base font size</span>
            </div>
            <div className={rowControlStyle}>
              <input
                type="range"
                min={12}
                max={20}
                value={settings.fontSize}
                onChange={e => updateSettings({ fontSize: Number(e.currentTarget.value) })}
                style={{ width: 120 }}
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                {settings.fontSize}px
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>Behavior</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Auto-accept Permissions</span>
              <span className={rowDescStyle}>Automatically accept tool permission requests</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.autoAcceptPermissions ?? false}
                onCheckedChange={checked => updateSettings({ autoAcceptPermissions: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Reasoning Summaries</span>
              <span className={rowDescStyle}>Show reasoning parts in message view</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.reasoningSummaries ?? true}
                onCheckedChange={checked => updateSettings({ reasoningSummaries: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Expand Shell Output</span>
              <span className={rowDescStyle}>Show shell tool output expanded by default</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.expandShellOutput ?? false}
                onCheckedChange={checked => updateSettings({ expandShellOutput: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Expand Edit Diffs</span>
              <span className={rowDescStyle}>Show file edit diffs expanded by default</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.expandEditDiffs ?? false}
                onCheckedChange={checked => updateSettings({ expandEditDiffs: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>Fonts</h3>
        <div className={fontRowStyle}>
          <Input
            label="UI Font"
            size="sm"
            placeholder="System default"
            value={settings.uiFont ?? ''}
            onChange={e => updateSettings({ uiFont: e.currentTarget.value })}
          />
          <Input
            label="Code Font"
            size="sm"
            placeholder="Monospace"
            value={settings.codeFont ?? ''}
            onChange={e => updateSettings({ codeFont: e.currentTarget.value })}
          />
          <Input
            label="Terminal Font"
            size="sm"
            placeholder="Monospace"
            value={settings.terminalFont ?? ''}
            onChange={e => updateSettings({ terminalFont: e.currentTarget.value })}
          />
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>Notifications</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Agent Notifications</span>
              <span className={rowDescStyle}>Notify when agent completes a task</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.agentNotifications ?? true}
                onCheckedChange={checked => updateSettings({ agentNotifications: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Permission Notifications</span>
              <span className={rowDescStyle}>Notify when permissions are requested</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.permissionNotifications ?? true}
                onCheckedChange={checked => updateSettings({ permissionNotifications: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Error Notifications</span>
              <span className={rowDescStyle}>Show desktop notifications for errors</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.errorNotifications ?? true}
                onCheckedChange={checked => updateSettings({ errorNotifications: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Desktop Notifications</span>
              <span className={rowDescStyle}>Show desktop notifications</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.notifications}
                onCheckedChange={checked => updateSettings({ notifications: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>Sounds</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Enable Sounds</span>
              <span className={rowDescStyle}>Play sounds for notifications</span>
            </div>
            <div className={rowControlStyle}>
              <Switch
                checked={settings.sounds}
                onCheckedChange={checked => updateSettings({ sounds: checked })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Agent Sound</span>
              <span className={rowDescStyle}>Sound played when agent completes</span>
            </div>
            <div className={rowControlStyle}>
              <Select
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'ping', label: 'Ping' },
                  { value: 'chime', label: 'Chime' },
                  { value: 'none', label: 'None' },
                ]}
                value={settings.agentSound ?? 'default'}
                onChange={e => updateSettings({ agentSound: e.currentTarget.value })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>Error Sound</span>
              <span className={rowDescStyle}>Sound played on errors</span>
            </div>
            <div className={rowControlStyle}>
              <Select
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'beep', label: 'Beep' },
                  { value: 'alert', label: 'Alert' },
                  { value: 'none', label: 'None' },
                ]}
                value={settings.errorSound ?? 'default'}
                onChange={e => updateSettings({ errorSound: e.currentTarget.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>About</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>OpenCode UI</span>
              <span className={rowDescStyle}>Version 0.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
