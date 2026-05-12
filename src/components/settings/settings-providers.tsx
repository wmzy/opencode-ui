import { css, cx } from '@linaria/core';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/context/language';
import { useSdk } from '@/context/sdk';
import type { Provider } from '@/types/provider';

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

const titleStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`;

const sectionTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 8px;
`;

const providerListStyle = css`
  display: flex;
  flex-direction: column;
`;

const providerRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
  min-height: 56px;

  &:last-child {
    border-bottom: none;
  }
`;

const providerInfoStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const providerIconStyle = css`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const providerNameStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const providerTagStyle = css`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
`;

const statusDotStyle = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const statusConnectedStyle = css`
  background: var(--color-success);
`;

const statusDisconnectedStyle = css`
  background: var(--color-text-tertiary);
`;

const emptyStyle = css`
  padding: 16px 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
`;

const loadingStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-tertiary);
`;

const errorStyle = css`
  padding: 16px 0;
  font-size: 14px;
  color: var(--color-error);
`;

const apiKeyFormStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const getSourceLabel = (source?: string, t?: (key: string) => string) => {
  if (source === 'env') return t ? t('settings.source_environment') : 'Environment';
  if (source === 'api') return t ? t('settings.source_api_key') : 'API Key';
  if (source === 'config') return t ? t('settings.source_config') : 'Config';
  if (source === 'custom') return t ? t('settings.source_custom') : 'Custom';
  return '';
};

export function SettingsProviders() {
  const { t } = useI18n();
  const { client } = useSdk();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<{ provider: Provider; open: boolean } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [providerResult, authResult] = await Promise.all([
        client.provider.list(),
        client.provider.auth(),
      ]);
      setProviders(providerResult.all as Provider[]);
      const authKeys = Object.keys(authResult);
      setConnectedIds(authKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleConnect = async () => {
    if (!connectDialog?.provider || !apiKey.trim()) return;
    try {
      setSubmitting(true);
      await client.auth.set(connectDialog.provider.id, {
        body: { type: 'api', key: apiKey.trim() },
      });
      setConnectedIds(prev => [...prev, connectDialog.provider.id]);
      setConnectDialog(null);
      setApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (providerID: string) => {
    try {
      await client.auth.remove(providerID);
      setConnectedIds(prev => prev.filter(id => id !== providerID));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect provider');
    }
  };

  if (loading) {
    return (
      <div className={containerStyle}>
        <h2 className={titleStyle}>{t('settings.providers')}</h2>
        <div className={loadingStyle}>
          <Spinner size="sm" color="muted" />
          {t('settings.loading_providers')}
        </div>
      </div>
    );
  }

  const connected = providers.filter(p => connectedIds.includes(p.id));
  const available = providers.filter(p => !connectedIds.includes(p.id));

  return (
    <div className={containerStyle}>
      <h2 className={titleStyle}>{t('settings.providers')}</h2>

      {error && <div className={errorStyle}>{error}</div>}

      <div>
        <h3 className={sectionTitleStyle}>{t('settings.connected')}</h3>
        <div className={providerListStyle}>
          {connected.length === 0 ? (
            <div className={emptyStyle}>{t('settings.no_providers_connected')}</div>
          ) : (
            connected.map(provider => (
              <div key={provider.id} className={providerRowStyle}>
                <div className={providerInfoStyle}>
                  <div className={cx(statusDotStyle, statusConnectedStyle)} />
                  <div className={providerIconStyle}>🔌</div>
                  <span className={providerNameStyle}>{provider.name}</span>
                  {provider.source && <span className={providerTagStyle}>{getSourceLabel(provider.source, t)}</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDisconnect(provider.id)}>
                  {t('settings.disconnect')}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>{t('settings.available')}</h3>
        <div className={providerListStyle}>
          {available.length === 0 ? (
            <div className={emptyStyle}>{t('settings.all_providers_connected')}</div>
          ) : (
            available.map(provider => (
              <div key={provider.id} className={providerRowStyle}>
                <div className={providerInfoStyle}>
                  <div className={cx(statusDotStyle, statusDisconnectedStyle)} />
                  <div className={providerIconStyle}>🔌</div>
                  <span className={providerNameStyle}>{provider.name}</span>
                  {provider.source && <span className={providerTagStyle}>{getSourceLabel(provider.source, t)}</span>}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setConnectDialog({ provider, open: true })}>
                  {t('settings.connect_provider')}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog
        open={connectDialog?.open ?? false}
        onClose={() => {
          setConnectDialog(null);
          setApiKey('');
        }}
        title={t('settings.connect_provider', { name: connectDialog?.provider.name ?? '' })}
        footer={(
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setConnectDialog(null);
                setApiKey('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConnect} disabled={!apiKey.trim() || submitting}>
              {submitting ? t('settings.connecting') : t('settings.connect_provider')}
            </Button>
          </>
        )}
      >
        <div className={apiKeyFormStyle}>
          <Input
            label={t('settings.enter_api_key')}
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={e => setApiKey(e.currentTarget.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
