import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { logger } from './utils/logger';

// Development logging only
logger.info('Land Visualizer loading...', new Date().toLocaleTimeString());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
