import { css, cx } from '@linaria/core';
import { Tabs as HazeTabs, TabList as HazeTabList, Tab as HazeTab, TabPanel as HazeTabPanel } from 'haze-ui';
import type { ReactNode } from 'react';

const tabsWrapperStyle = css`
  display: flex;
  flex-direction: column;
`;

const horizontalStyle = css`
  flex-direction: column;
`;

const verticalStyle = css`
  flex-direction: row;

  & > div:first-child {
    flex-direction: column;
    border-bottom: none;
    border-right: 1px solid var(--color-border);
    padding-right: 12px;
    min-width: 140px;
  }
`;

const tabListStyle = css`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
`;

const tabStyle = css`
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;

  &:hover {
    color: var(--color-text);
  }

  &[data-active='true'] {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }
`;

const panelStyle = css`
  padding: 16px 0;
`;

export type TabsProps = {
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: ReactNode;
};

export function Tabs({
  defaultValue,
  orientation = 'horizontal',
  className,
  children,
}: TabsProps) {
  return (
    <div className={cx(tabsWrapperStyle, orientation === 'vertical' ? verticalStyle : horizontalStyle, className)}>
      <HazeTabs value={defaultValue}>
        {children}
      </HazeTabs>
    </div>
  );
}

export type TabListProps = {
  className?: string;
  children: ReactNode;
};

export function TabList({ className, children }: TabListProps) {
  return <HazeTabList className={cx(tabListStyle, className)}>{children}</HazeTabList>;
}

export type TabProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

export function Tab({ value, className, children }: TabProps) {
  return (
    <HazeTab value={value} className={cx(tabStyle, className)}>
      {children}
    </HazeTab>
  );
}

export type TabPanelProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

export function TabPanel({ value, className, children }: TabPanelProps) {
  return (
    <HazeTabPanel value={value} className={cx(panelStyle, className)}>
      {children}
    </HazeTabPanel>
  );
}
