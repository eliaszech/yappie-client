import { createRoot } from 'react-dom/client'
import './assets/index.css'
import App from './App.jsx'
import { initTheme } from './hooks/useTheme.js'

initTheme();
import './locales/i18n.js'
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";
import {AuthProvider} from "./context/AuthProvider.jsx";

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
                <App />
        </AuthProvider>
    </QueryClientProvider>
)
