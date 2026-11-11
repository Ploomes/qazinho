import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';
import '@/languages';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-mono/600.css';
import '@fontsource/geist-mono/700.css';
import '@/shared/styles/tokens.css';
import '@/shared/styles/base.css';
import '@/shared/styles/animations.css';

const container = document.getElementById('root');

if (!container) throw new Error('index.html has no #root to mount the page into.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
