import { css } from '@linaria/core';
import { useState } from 'react';
import { Dialog } from './dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/language';

const formStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export type EditProjectDialogProps = {
  open: boolean;
  onClose: () => void;
  currentName?: string;
  onSave?: (name: string) => void;
};

export function EditProjectDialog({ open, onClose, currentName = '', onSave }: EditProjectDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState(currentName);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave?.(name.trim());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('session.edit_project_name')}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {t('common.save')}
          </Button>
        </div>
      )}
    >
      <div className={formStyle}>
        <Input
          label="Project Name"
          value={name}
          onChange={e => setName(e.currentTarget.value)}
          placeholder="My Project"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
          }}
        />
      </div>
    </Dialog>
  );
}
