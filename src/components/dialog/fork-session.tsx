import { Dialog } from './dialog';
import { Button } from '@/components/ui/button';

export type ForkSessionDialogProps = {
  open: boolean;
  onClose: () => void;
  onFork?: () => void;
  sessionName?: string;
};

export function ForkSessionDialog({ open, onClose, onFork, sessionName }: ForkSessionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Fork Session"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onFork?.();
              onClose();
            }}
          >
            Fork
          </Button>
        </div>
      }
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
