import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { ModelProvider } from './context/ModelContext';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AuthObserver from './components/common/AuthObserver';
import { initFirebase } from './config/firebase';

await initFirebase();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthObserver>
          <ThemeProvider>
            <ModelProvider>
              <App />
            </ModelProvider>
          </ThemeProvider>
        </AuthObserver>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
