import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DemoProvider } from './context/DemoContext';
import { AcessibilidadeProvider } from './context/AcessibilidadeContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AcessibilidadeProvider>
      <DemoProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DemoProvider>
    </AcessibilidadeProvider>
  </React.StrictMode>,
);
