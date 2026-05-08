import { css } from '@linaria/core';
import { useNavigate } from 'react-router-dom';

const container = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  color: var(--color-text-secondary);
`;

const code = css`
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
`;

const message = css`
  font-size: 1.125rem;
`;

const link = css`
  color: var(--color-accent);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={container}>
      <div className={code}>404</div>
      <div className={message}>Page not found</div>
      <span className={link} onClick={() => navigate('/')}>
        Go home
      </span>
    </div>
  );
}
