import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ArcadeProvider } from './context/ArcadeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArcadeProvider>
      <App />
    </ArcadeProvider>
  </React.StrictMode>
);
