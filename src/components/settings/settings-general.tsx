import { css } from '@linaria/core';
import { useState, useEffect, useCallback } from 'react';
import { useTheme, type ColorScheme } from '@/context/theme';
import { useSettings } from '@/context/settings';
import { useI18n } from '@/context/language';
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

  @media (max-width: 768px) {
    padding: 16px;
    gap: 24px;
  }
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
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 8px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
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

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export function SettingsGeneral() {
  const { t } = useI18n();
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
    { value: 'system', label: t('theme.system') },
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ];

  const shellOptions = [
    { value: '', label: t('settings.default') },
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
        <h3 className={sectionTitleStyle}>{t('settings.appearance')}</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>{t('settings.color_scheme')}</span>
              <span className={rowDescStyle}>{t('settings.color_scheme_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.theme')}</span>
              <span className={rowDescStyle}>{t('settings.theme_desc')}</span>
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
        <h3 className={sectionTitleStyle}>{t('settings.general')}</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>{t('settings.language')}</span>
              <span className={rowDescStyle}>{t('settings.language_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.shell')}</span>
              <span className={rowDescStyle}>{t('settings.shell_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.font_size')}</span>
              <span className={rowDescStyle}>{t('settings.font_size_desc')}</span>
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
        <h3 className={sectionTitleStyle}>{t('settings.behavior')}</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>{t('settings.auto_accept')}</span>
              <span className={rowDescStyle}>{t('settings.auto_accept_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.reasoning')}</span>
              <span className={rowDescStyle}>{t('settings.reasoning_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.expand_shell')}</span>
              <span className={rowDescStyle}>{t('settings.expand_shell_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.expand_diffs')}</span>
              <span className={rowDescStyle}>{t('settings.expand_diffs_desc')}</span>
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
        <h3 className={sectionTitleStyle}>{t('settings.fonts')}</h3>
        <div className={fontRowStyle}>
          <Input
            label={t('settings.ui_font')}
            size="sm"
            placeholder={t('settings.font_system_default')}
            value={settings.uiFont ?? ''}
            onChange={e => updateSettings({ uiFont: e.currentTarget.value })}
          />
          <Input
            label={t('settings.code_font')}
            size="sm"
            placeholder={t('settings.font_monospace')}
            value={settings.codeFont ?? ''}
            onChange={e => updateSettings({ codeFont: e.currentTarget.value })}
          />
          <Input
            label={t('settings.terminal_font')}
            size="sm"
            placeholder={t('settings.font_monospace')}
            value={settings.terminalFont ?? ''}
            onChange={e => updateSettings({ terminalFont: e.currentTarget.value })}
          />
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>{t('settings.notifications')}</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>{t('settings.agent_notifications')}</span>
              <span className={rowDescStyle}>{t('settings.agent_notifications_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.permission_notifications')}</span>
              <span className={rowDescStyle}>{t('settings.permission_notifications_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.error_notifications')}</span>
              <span className={rowDescStyle}>{t('settings.error_notifications_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.desktop_notifications')}</span>
              <span className={rowDescStyle}>{t('settings.desktop_notifications_desc')}</span>
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
        <h3 className={sectionTitleStyle}>{t('settings.sounds_section')}</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>{t('settings.enable_sounds')}</span>
              <span className={rowDescStyle}>{t('settings.enable_sounds_desc')}</span>
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
              <span className={rowTitleStyle}>{t('settings.agent_sound')}</span>
              <span className={rowDescStyle}>{t('settings.agent_sound_desc')}</span>
            </div>
            <div className={rowControlStyle}>
              <Select
                options={[
                  { value: 'default', label: t('settings.default') },
                  { value: 'ping', label: t('settings.ping') },
                  { value: 'chime', label: t('settings.chime') },
                  { value: 'none', label: t('settings.none') },
                ]}
                value={settings.agentSound ?? 'default'}
                onChange={e => updateSettings({ agentSound: e.currentTarget.value })}
              />
            </div>
          </div>

          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>{t('settings.error_sound')}</span>
              <span className={rowDescStyle}>{t('settings.error_sound_desc')}</span>
            </div>
            <div className={rowControlStyle}>
              <Select
                options={[
                  { value: 'default', label: t('settings.default') },
                  { value: 'beep', label: t('settings.beep') },
                  { value: 'alert', label: t('settings.alert') },
                  { value: 'none', label: t('settings.none') },
                ]}
                value={settings.errorSound ?? 'default'}
                onChange={e => updateSettings({ errorSound: e.currentTarget.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>{t('settings.about')}</h3>
        <div className={settingsListStyle}>
          <div className={settingsRowStyle}>
            <div className={rowTextStyle}>
              <span className={rowTitleStyle}>OpenCode UI</span>
              <span className={rowDescStyle}>{t('settings.version')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
