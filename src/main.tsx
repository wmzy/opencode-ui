import React from 'react';
import { createRoot } from 'react-dom/client';
import { cx } from '@linaria/core';
import { lightTheme, spacing, typography } from 'haze-ui';
import { App } from './App';
import { globalStyles } from './styles/global';
import 'haze-ui/styles.css';

function Root() {
  return (
    <div className={cx(globalStyles, lightTheme, spacing, typography)}>
      <App />
    </div>
  );
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
