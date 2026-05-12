import { css } from '@linaria/core';
import { Dialog } from './dialog';
import { useI18n } from '@/context/language';

const notesStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 480px;
  overflow-y: auto;
`;

const versionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const versionTitleStyle = css`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`;

const versionDateStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
`;

const listStyle = css`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const listItemStyle = css`
  font-size: 14px;
  color: var(--color-text-secondary);
  padding-left: 16px;
  position: relative;

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--color-text-tertiary);
  }
`;

const RELEASE_NOTES = [
  {
    version: '0.1.0',
    date: '2026-05-07',
    changes: [
      'Initial release of OpenCode UI',
      'Web-based frontend for OpenCode',
      'Theme system with 37 built-in themes',
      'Settings dialog with General, Shortcuts, Providers, and Models panels',
      'Mobile-responsive design',
      'PWA support',
    ],
  },
];

export type ReleaseNotesDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ReleaseNotesDialog({ open, onClose }: ReleaseNotesDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} title={t('session.release_notes')}>
      <div className={notesStyle}>
        {RELEASE_NOTES.map(release => (
          <div key={release.version} className={versionStyle}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className={versionTitleStyle}>v{release.version}</span>
              <span className={versionDateStyle}>{release.date}</span>
            </div>
            <ul className={listStyle}>
              {release.changes.map((change, i) => (
                <li key={i} className={listItemStyle}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
