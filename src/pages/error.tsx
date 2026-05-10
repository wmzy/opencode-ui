import { css } from '@linaria/core';

const container = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
`;

const errorTitle = css`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-error);
`;

const errorMessage = css`
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  max-width: 400px;
  text-align: center;
`;

export function ErrorPage({ error }: { error?: Error }) {
  return (
    <div className={container}>
      <div className={errorTitle}>Something went wrong</div>
      <div className={errorMessage}>
        {error?.message ?? 'An unexpected error occurred'}
      </div>
    </div>
  );
}
