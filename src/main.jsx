import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import App from './App.jsx'
import './locales/i18n.js'
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <App />,
    </QueryClientProvider>
)
