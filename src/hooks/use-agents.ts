import { useState, useEffect, useMemo } from 'react';
import type { Agent } from '@/types/provider';
import type { OpenCodeSdk } from '@/lib/sdk';

function isAgent(value: unknown): value is Agent {
  if (!value || typeof value !== 'object') return false;
  const item = value as { name?: unknown; mode?: unknown };
  if (typeof item.name !== 'string') return false;
  return item.mode === 'subagent' || item.mode === 'primary' || item.mode === 'all';
}

function normalizeAgentList(input: unknown): Agent[] {
  if (Array.isArray(input)) return input.filter(isAgent);
  if (isAgent(input)) return [input];
  if (!input || typeof input !== 'object') return [];
  const wrapped = (input as { data?: unknown }).data;
  if (wrapped !== undefined) return normalizeAgentList(wrapped);
  return Object.values(input).filter(isAgent);
}

type UseAgentsResult = {
  agents: Agent[];
  agentNames: string[];
  loading: boolean;
  error: string | null;
};

export function useAgents(sdk: OpenCodeSdk | null): UseAgentsResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sdk) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    sdk.agent
      .list()
      .then((data) => {
        if (cancelled) return;
        setAgents(normalizeAgentList(data));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load agents');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  const agentNames = useMemo(
    () => agents.filter((a) => a.mode !== 'subagent' && !a.hidden).map((a) => a.name),
    [agents],
  );

  return { agents, agentNames, loading, error };
}
