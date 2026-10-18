import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';
import '@/languages';
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
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
