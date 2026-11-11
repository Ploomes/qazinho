import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Island } from '@/modules/Island/screens/Island';
import '@/languages';
import '@fontsource/geist/400.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist-mono/400.css';
import '@/shared/styles/tokens.css';
import '@/shared/styles/base.css';

const container = document.getElementById('root');

if (!container) throw new Error('island.html has no #root to mount the page into.');

createRoot(container).render(
  <StrictMode>
    <Island />
  </StrictMode>,
);
