import { css } from '@linaria/core';
import { Dialog } from './dialog';
import { Button } from '@/components/ui/button';

type ProviderOption = {
  id: string;
  name: string;
  description?: string;
};

const PROVIDERS: ProviderOption[] = [
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models' },
  { id: 'openai', name: 'OpenAI', description: 'GPT models' },
  { id: 'google', name: 'Google', description: 'Gemini models' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Multi-provider gateway' },
  { id: 'vercel', name: 'Vercel', description: 'Vercel AI gateway' },
  { id: 'xai', name: 'xAI', description: 'Grok models' },
  { id: 'mistral', name: 'Mistral', description: 'Mistral models' },
  { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek models' },
];

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 420px;
  overflow-y: auto;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const itemInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const itemNameStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const itemDescStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
`;

export type SelectProviderDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect?: (providerId: string) => void;
};

export function SelectProviderDialog({ open, onClose, onSelect }: SelectProviderDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Select Provider">
      <div className={listStyle}>
        {PROVIDERS.map(provider => (
          <div
            key={provider.id}
            className={itemStyle}
            onClick={() => {
              onSelect?.(provider.id);
              onClose();
            }}
          >
            <div className={itemInfoStyle}>
              <span className={itemNameStyle}>{provider.name}</span>
              {provider.description && (
                <span className={itemDescStyle}>{provider.description}</span>
              )}
            </div>
            <Button variant="secondary" size="sm">Connect</Button>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
