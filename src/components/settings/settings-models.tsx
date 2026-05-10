import { css } from '@linaria/core';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useSdk } from '@/context/sdk';
import type { Provider, Model } from '@/types/provider';

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 32px 48px;
  max-width: 720px;
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

const modelListStyle = css`
  display: flex;
  flex-direction: column;
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

const providerBadgeStyle = css`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  text-transform: capitalize;
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

export function SettingsModels() {
  const { client } = useSdk();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    const models: (Model & { providerName: string })[] = [];
    for (const provider of providers) {
      for (const model of Object.values(provider.models)) {
        models.push({ ...model, providerName: provider.name });
      }
    }
    return models;
  }, [providers]);

  const providerOptions = useMemo(() => [
    { value: 'all', label: 'All Providers' },
    ...providers.map(p => ({ value: p.id, label: p.name })),
  ], [providers]);

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
    if (filterProvider !== 'all') return { [filterProvider]: filteredModels };
    const groups: Record<string, typeof filteredModels> = {};
    for (const model of filteredModels) {
      if (!groups[model.providerID]) groups[model.providerID] = [];
      groups[model.providerID].push(model);
    }
    return groups;
  }, [filteredModels, filterProvider]);

  const providerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of providers) map[p.id] = p.name;
    return map;
  }, [providers]);

  if (loading) {
    return (
      <div className={containerStyle}>
        <h2 className={titleStyle}>Models</h2>
        <div className={loadingStyle}>
          <Spinner size="sm" color="muted" />
          Loading models...
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      <h2 className={titleStyle}>Models</h2>

      {error && <div className={errorStyle}>{error}</div>}

      <div className={filterRowStyle}>
        <span className={filterLabelStyle}>Filter by provider:</span>
        <Select
          options={providerOptions}
          value={filterProvider}
          onChange={e => setFilterProvider(e.currentTarget.value)}
        />
        <div className={searchInputStyle}>
          <Input
            size="sm"
            placeholder="Search models..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.currentTarget.value)}
          />
        </div>
      </div>

      <div>
        <h3 className={sectionTitleStyle}>Available Models</h3>
        <div className={modelListStyle}>
          {filteredModels.length === 0 ? (
            <div className={emptyStyle}>No models found</div>
          ) : (
            Object.entries(groupedModels).map(([providerID, models]) => (
              <div key={providerID}>
                {filterProvider === 'all' && (
                  <div className={providerSectionStyle}>{providerNameMap[providerID] ?? providerID}</div>
                )}
                {models.map(model => (
                  <div key={model.id} className={modelRowStyle}>
                    <div className={modelInfoStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={modelNameStyle}>{model.name}</span>
                        {filterProvider !== 'all' && (
                          <span className={providerBadgeStyle}>{model.providerName}</span>
                        )}
                        <span className={statusBadgeStyle} data-status={model.status}>{model.status}</span>
                      </div>
                      <div className={modelMetaStyle}>
                        <span>{model.id}</span>
                        <span>Context: {(model.limit.context / 1000).toFixed(0)}K</span>
                        {model.cost && (
                          <>
                            <span>In: ${model.cost.input}/MTok</span>
                            <span>Out: ${model.cost.output}/MTok</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
