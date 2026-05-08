import { css, cx } from '@linaria/core';
import { useCallback } from 'react';
import { useSdk } from '@/context/sdk';
import { usePermissions } from '@/context/global-sync';
import { Button } from '@/components/ui/button';

type PermissionDockProps = {
  sessionId: string;
  className?: string;
};

const dockStyle = css`
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
`;

const permissionCardStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
`;

const permissionInfoStyle = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const permissionTitleStyle = css`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const permissionToolStyle = css`
  font-size: 11px;
  font-weight: 500;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const permissionDescStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const permissionActionsStyle = css`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const allowBtnStyle = css`
  --haze-color-primary: var(--color-success);
  --haze-color-primary-hover: #16a34a;
  --haze-color-primary-active: #15803d;
`;

const denyBtnStyle = css`
  --haze-color-primary: var(--color-error);
  --haze-color-primary-hover: #dc2626;
  --haze-color-primary-active: #b91c1c;
`;

export function SessionPermissionDock({ sessionId, className }: PermissionDockProps) {
  const { client } = useSdk();
  const permissions = usePermissions(sessionId);

  const handleReply = useCallback(
    async (requestID: string, reply: 'once' | 'reject') => {
      try {
        await client.permission.reply(requestID, { body: { reply } });
      } catch {
        // error handled silently - UI auto-updates via SSE
      }
    },
    [client],
  );

  if (permissions.length === 0) return null;

  return (
    <div className={cx(dockStyle, className)}>
      {permissions.map((p) => (
        <div key={p.id} className={permissionCardStyle}>
          <div className={permissionInfoStyle}>
            <div className={permissionToolStyle}>{p.type}</div>
            <div className={permissionTitleStyle}>{p.title}</div>
            {typeof p.metadata?.description === 'string' && (
              <div className={permissionDescStyle}>{p.metadata.description as string}</div>
            )}
          </div>
          <div className={permissionActionsStyle}>
            <Button
              size="sm"
              className={allowBtnStyle}
              onClick={() => handleReply(p.id, 'once')}
            >
              Allow
            </Button>
            <Button
              size="sm"
              className={denyBtnStyle}
              onClick={() => handleReply(p.id, 'reject')}
            >
              Deny
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
