import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { ErrorBoundary } from './app/components/ErrorBoundary.tsx';
import { loadTheme, applyTheme } from './app/hooks/useAppTheme';
import { seedDevAccounts } from './app/hooks/accountStore';
import './styles/index.css';

applyTheme(loadTheme());
seedDevAccounts();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>
);
