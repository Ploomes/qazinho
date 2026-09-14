import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/renderer/app';
import '@/renderer/styles/base.css';

const root = document.getElementById('root');

if (!root) throw new Error('index.html is missing the #root element.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
