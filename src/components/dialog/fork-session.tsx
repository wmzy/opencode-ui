import { Dialog } from './dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/language';

export type ForkSessionDialogProps = {
  open: boolean;
  onClose: () => void;
  onFork?: () => void;
  sessionName?: string;
};

export function ForkSessionDialog({ open, onClose, onFork, sessionName }: ForkSessionDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('session.fork_session')}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            onClick={() => {
              onFork?.();
              onClose();
            }}
          >
            {t('session.fork')}
          </Button>
        </div>
      )}
    >
      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        {sessionName ? (
          <p>
            This will create a new session branching from the current state of
            &quot;{sessionName}&quot;. The original session will remain unchanged.
          </p>
        ) : (
          <p>
            This will create a new session branching from the current state.
            The original session will remain unchanged.
          </p>
        )}
      </div>
    </Dialog>
  );
}
