import { css } from '@linaria/core';
import { useState } from 'react';
import { Dialog } from './dialog';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/context/language';

type ModelOption = {
  id: string;
  name: string;
  provider: string;
};

const MODELS: ModelOption[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
];

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &[data-active='true'] {
    background: var(--color-bg-tertiary);
  }
`;

const itemNameStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const itemProviderStyle = css`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  text-transform: capitalize;
`;

export type SelectModelDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect?: (modelId: string) => void;
  currentModel?: string;
};

export function SelectModelDialog({ open, onClose, onSelect, currentModel }: SelectModelDialogProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? MODELS.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.provider.toLowerCase().includes(query.toLowerCase()),
      )
    : MODELS;

  return (
    <Dialog open={open} onClose={onClose} title={t('session.select_model')}>
      <div style={{ marginBottom: 12 }}>
        <Input
          placeholder={t('session.search_models')}
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
          size="md"
        />
      </div>
      <div className={listStyle}>
        {filtered.map(model => (
          <div
            key={model.id}
            className={itemStyle}
            data-active={model.id === currentModel}
            onClick={() => {
              onSelect?.(model.id);
              onClose();
            }}
          >
            <span className={itemNameStyle}>{model.name}</span>
            <span className={itemProviderStyle}>{model.provider}</span>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
