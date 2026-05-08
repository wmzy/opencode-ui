import { css, cx } from '@linaria/core';
import { useState, useCallback } from 'react';
import { useTodos } from '@/context/global-sync';

type TodoDockProps = {
  sessionId: string;
  className?: string;
};

const dockStyle = css`
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const chevronStyle = css`
  font-size: 10px;
  color: var(--color-text-tertiary);
  transition: transform 0.15s;
  display: inline-block;
`;

const chevronOpenStyle = css`
  transform: rotate(90deg);
`;

const headerTextStyle = css`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
`;

const countBadgeStyle = css`
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
`;

const listStyle = css`
  padding: 0 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const todoItemStyle = css`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  line-height: 1.4;
`;

const statusDotBase = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
`;

const statusPending = css`
  ${statusDotBase};
  background: var(--color-text-tertiary);
`;

const statusInProgress = css`
  ${statusDotBase};
  background: var(--color-accent);
  box-shadow: 0 0 4px var(--color-accent);
`;

const statusCompleted = css`
  ${statusDotBase};
  background: var(--color-success);
`;

const todoContentStyle = css`
  color: var(--color-text-secondary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const todoCompletedContent = css`
  ${todoContentStyle};
  text-decoration: line-through;
  opacity: 0.6;
`;

const priorityBadgeStyle = css`
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const priorityHigh = css`
  ${priorityBadgeStyle};
  background: color-mix(in srgb, var(--color-error) 15%, transparent);
  color: var(--color-error);
`;

const priorityMedium = css`
  ${priorityBadgeStyle};
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  color: var(--color-warning);
`;

const priorityLow = css`
  ${priorityBadgeStyle};
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
`;

function getStatusClass(status: string) {
  if (status === 'in_progress') return statusInProgress;
  if (status === 'completed') return statusCompleted;
  return statusPending;
}

function getPriorityClass(priority: string) {
  if (priority === 'high') return priorityHigh;
  if (priority === 'medium') return priorityMedium;
  return priorityLow;
}

export function SessionTodoDock({ sessionId, className }: TodoDockProps) {
  const todos = useTodos(sessionId);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  if (todos.length === 0) return null;

  const completedCount = todos.filter((t) => t.status === 'completed').length;

  return (
    <div className={cx(dockStyle, className)}>
      <div className={headerStyle} onClick={toggleCollapse}>
        <span
          className={cx(chevronStyle, !collapsed && chevronOpenStyle)}
        >
          ▶
        </span>
        <span className={headerTextStyle}>Todos</span>
        <span className={countBadgeStyle}>
          {completedCount}/{todos.length}
        </span>
      </div>
      {!collapsed && (
        <div className={listStyle}>
          {todos.map((todo) => (
            <div key={todo.id} className={todoItemStyle}>
              <span className={getStatusClass(todo.status)} />
              <span
                className={
                  todo.status === 'completed' ? todoCompletedContent : todoContentStyle
                }
              >
                {todo.content}
              </span>
              <span className={getPriorityClass(todo.priority)}>
                {todo.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
