import { useState, useEffect, useMemo } from 'react';
import type { Provider, Model } from '@/types/provider';
import type { OpenCodeSdk } from '@/lib/sdk';

type FlatModel = Model & {
  provider: Provider;
};

type UseProvidersResult = {
  providers: Provider[];
  connectedProviders: Provider[];
  models: FlatModel[];
  defaultModel: { providerID: string; modelID: string } | null;
  connected: string[];
  loading: boolean;
  error: string | null;
};

export function useProviders(sdk: OpenCodeSdk | null): UseProvidersResult {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [defaultModelRef, setDefaultModelRef] = useState<{ providerID: string; modelID: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sdk) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    sdk.provider
      .list()
      .then((data) => {
        if (cancelled) return;
        const allProviders = ((data?.all ?? []) as Provider[]).map((p) => ({
          ...p,
          models: Object.fromEntries(
            Object.entries(p.models).filter(([, m]) => m.status === 'active'),
          ),
        }));
        setProviders(allProviders);
        setConnectedIds(data?.connected ?? []);

        if (data?.default && typeof data.default === 'object') {
          const entries = Object.entries(data.default);
          if (entries.length > 0) {
            const [providerID, modelID] = entries[0];
            setDefaultModelRef({ providerID, modelID: String(modelID) });
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load providers');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  const connectedProviders = useMemo(() => {
    const set = new Set(connectedIds);
    return providers.filter((p) => set.has(p.id));
  }, [providers, connectedIds]);

  const models = useMemo<FlatModel[]>(() => {
    const result: FlatModel[] = [];
    for (const provider of connectedProviders) {
      for (const model of Object.values(provider.models)) {
        result.push({ ...model, provider });
      }
    }
    return result;
  }, [connectedProviders]);

  return { providers, connectedProviders, models, defaultModel: defaultModelRef, connected: connectedIds, loading, error };
}

export type { FlatModel };
