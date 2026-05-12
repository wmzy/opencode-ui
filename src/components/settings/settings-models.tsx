import { css, cx } from '@linaria/core';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/context/language';
import { useSdk } from '@/context/sdk';
import type { Provider, Model } from '@/types/provider';

const STORAGE_KEY = 'opencode-model-visibility';

type Visibility = "show" | "hide";

type ModelVisibility = {
  providerID: string;
  modelID: string;
  visibility: Visibility;
};

function loadVisibility(): ModelVisibility[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ModelVisibility[];
  } catch {
    return [];
  }
}

function saveVisibility(items: ModelVisibility[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

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

const modelListStyle = css`
  display: flex;
  flex-direction: column;
`;

const sectionTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 8px;
`;

const modelRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const modelInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const modelNameStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const modelMetaStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: flex;
  gap: 12px;
`;

const statusBadgeStyle = css`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;

  &[data-status="active"] {
    background: color-mix(in srgb, var(--color-success) 20%, transparent);
    color: var(--color-success);
  }
  &[data-status="beta"] {
    background: color-mix(in srgb, var(--color-accent) 20%, transparent);
    color: var(--color-accent);
  }
  &[data-status="alpha"] {
    background: color-mix(in srgb, var(--color-warning) 20%, transparent);
    color: var(--color-warning);
  }
  &[data-status="deprecated"] {
    background: color-mix(in srgb, var(--color-error) 20%, transparent);
    color: var(--color-error);
  }
`;

const modelRowDisabledStyle = css`
  opacity: 0.5;
`;

const modelNameDisabledStyle = css`
  text-decoration: line-through;
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

const emptyStyle = css`
  padding: 16px 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
`;

const errorStyle = css`
  padding: 16px 0;
  font-size: 14px;
  color: var(--color-error);
`;

const filterRowStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const filterLabelStyle = css`
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
`;

const searchInputStyle = css`
  flex: 1;
  min-width: 180px;
`;

const providerSectionStyle = css`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 0 4px;
  border-bottom: 1px solid var(--color-border);
`;

type ModelEntry = Model & { providerName: string; providerID: string };

export function SettingsModels() {
  const { t } = useI18n();
  const { client } = useSdk();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityMap, setVisibilityMap] = useState<Map<string, Visibility>>(() => {
    const items = loadVisibility();
    const map = new Map<string, Visibility>();
    for (const item of items) {
      map.set(`${item.providerID}:${item.modelID}`, item.visibility);
    }
    return map;
  });

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.config.providers();
      setProviders(result.providers as Provider[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const allModels = useMemo(() => {
    const models: ModelEntry[] = [];
    for (const provider of providers) {
      for (const model of Object.values(provider.models)) {
        models.push({ ...model, providerName: provider.name, providerID: provider.id });
      }
    }
    return models;
  }, [providers]);

  const filteredModels = useMemo(() => {
    let result = allModels;
    if (filterProvider !== 'all') {
      result = result.filter(m => m.providerID === filterProvider);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allModels, filterProvider, searchQuery]);

  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelEntry[]> = {};
    for (const model of filteredModels) {
      if (!groups[model.providerID]) groups[model.providerID] = [];
      groups[model.providerID].push(model);
    }
    return groups;
  }, [filteredModels]);

  const providerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of providers) map[p.id] = p.name;
    return map;
  }, [providers]);

  const isVisible = useCallback((providerID: string, modelID: string) => {
    const key = `${providerID}:${modelID}`;
    const state = visibilityMap.get(key);
    if (state === 'hide') return false;
    return true;
  }, [visibilityMap]);

  const handleToggle = useCallback((providerID: string, modelID: string, visible: boolean) => {
    const key = `${providerID}:${modelID}`;
    setVisibilityMap(prev => {
      const next = new Map(prev);
      if (visible) {
        next.set(key, 'show');
      } else {
        next.set(key, 'hide');
      }
      const items: ModelVisibility[] = [];
      for (const [k, v] of next) {
        const [pID, mID] = k.split(':');
        items.push({ providerID: pID, modelID: mID, visibility: v });
      }
      saveVisibility(items);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className={containerStyle}>
        <h2 className={titleStyle}>{t('settings.models')}</h2>
        <div className={loadingStyle}>
          <Spinner size="sm" color="muted" />
          {t('settings.loading_models')}
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      <h2 className={titleStyle}>{t('settings.models')}</h2>

      {error && <div className={errorStyle}>{error}</div>}

      <div className={filterRowStyle}>
        <span className={filterLabelStyle}>{t('settings.filter_provider')}</span>
        <Select
          options={[
            { value: 'all', label: t('settings.all_providers') },
            ...providers.map(p => ({ value: p.id, label: p.name })),
          ]}
          value={filterProvider}
          onChange={e => setFilterProvider(e.currentTarget.value)}
        />
        <div className={searchInputStyle}>
          <Input
            size="sm"
            placeholder={t('settings.search_models')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.currentTarget.value)}
          />
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>{t('settings.available_models')}</h3>
        <div className={modelListStyle}>
          {filteredModels.length === 0 ? (
            <div className={emptyStyle}>{t('settings.no_models')}</div>
          ) : (
            Object.entries(groupedModels).map(([providerID, models]) => (
              <div key={providerID}>
                {filterProvider === 'all' && (
                  <div className={providerSectionStyle}>{providerNameMap[providerID] ?? providerID}</div>
                )}
              {models.map(model => {
                const visible = isVisible(providerID, model.id);
                return (
                  <div key={model.id} className={cx(modelRowStyle, !visible && modelRowDisabledStyle)}>
                    <div className={modelInfoStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={cx(modelNameStyle, !visible && modelNameDisabledStyle)}>{model.name}</span>
                        {model.status !== 'active' && (
                          <span className={statusBadgeStyle} data-status={model.status}>{model.status}</span>
                        )}
                      </div>
                      <div className={modelMetaStyle}>
                        <span>{model.id}</span>
                        <span>{t('settings.context')}: {(model.limit.context / 1000).toFixed(0)}K</span>
                        {model.cost && (
                          <>
                            <span>{t('settings.in_price')}: ${model.cost.input}/MTok</span>
                            <span>{t('settings.out_price')}: ${model.cost.output}/MTok</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={visible}
                      onCheckedChange={checked => handleToggle(providerID, model.id, checked)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
