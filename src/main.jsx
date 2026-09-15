import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArcaneHero } from './components/ArcaneHero.jsx';
import './styles.css';
import './music-toast.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ArcaneHero />
  </React.StrictMode>,
);
