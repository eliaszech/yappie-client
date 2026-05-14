import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken, setToken, removeToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { AuthContext } from "./AuthContext.jsx";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];
const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => !!getToken());
    const [authError, setAuthError] = useState(null); // null | 'offline' | 'server_error' | 'expired'
    const [retryCount, setRetryCount] = useState(0);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const queryClient = useQueryClient();
    const initRunning = useRef(false);

    const initAuth = useCallback(async (attempt = 0) => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        if (attempt === 0) {
            setLoading(true);
            setAuthError(null);
            setRetryCount(0);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let res;
            try {
                res = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (res.status === 401 || res.status === 403) {
                removeToken();
                setAuthError('expired');
                setIsReconnecting(false);
                setLoading(false);
                initRunning.current = false;
                return;
            }

            if (!res.ok) {
                throw new Error(`HTTP_${res.status}`);
            }

            const data = await res.json();
            connectSocket();
            setUser({ ...data.user, online: true });
            queryClient.setQueryData(['presence'], (old = {}) => ({
                ...old,
                [data.id]: { online: true, status: data.status || 'online' }
            }));
            setAuthError(null);
            setIsReconnecting(false);
            setLoading(false);
            initRunning.current = false;

        } catch (e) {
            if (attempt < MAX_RETRIES - 1) {
                setRetryCount(attempt + 1);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
                if (!getToken() || !initRunning.current) return;
                return initAuth(attempt + 1);
            }

            const isNetworkError =
                e.name === 'AbortError' ||
                e.name === 'TypeError' ||
                !navigator.onLine;

            setAuthError(isNetworkError ? 'offline' : 'server_error');
            setLoading(false);
            initRunning.current = false;
        }
    }, [queryClient]);

    // Lightweight background health check — only runs when user is logged in
    const backgroundCheck = useCallback(async () => {
        const token = getToken();
        if (!token || initRunning.current) return;

        try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 5000);
            let res;
            try {
                res = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(tid);
            }

            if (res.status === 401) {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            // If ok, backend is reachable — nothing to do
        } catch {
            // Backend unreachable — show splash and start retry loop
            // user stays set (React Query cache preserved); splash shows because loading=true
            setIsReconnecting(true);
            initRunning.current = true;
            initAuth(0);
        }
    }, [initAuth]);

    // Start background health check once user is logged in
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(backgroundCheck, HEALTH_CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [user, backgroundCheck]);

    // Initial auth check on mount
    useEffect(() => {
        if (getToken() && !user) {
            initRunning.current = true;
            initAuth(0);
        }
    }, []);

    // Handle 401 from any API request while the session is active
    useEffect(() => {
        function handleUnauthorized() {
            initRunning.current = false;
            removeToken();
            disconnectSocket();
            setUser(null);
            setAuthError('expired');
            setIsReconnecting(false);
            setLoading(false);
        }
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const logout = useCallback(() => {
        initRunning.current = false;
        disconnectSocket();
        removeToken();
        setUser(null);
        setAuthError(null);
        setRetryCount(0);
        setIsReconnecting(false);
        setLoading(false);
    }, []);

    const retry = useCallback(() => {
        initRunning.current = true;
        initAuth(0);
    }, [initAuth]);

    function login(token, userData) {
        initRunning.current = false;
        setToken(token);
        setAuthError(null);
        setIsReconnecting(false);
        setLoading(false);
        connectSocket();
        setUser({ ...userData, online: true });
        queryClient.setQueryData(['presence'], (old = {}) => ({
            ...old,
            [userData.id]: { online: true, status: userData.status || 'online' }
        }));
    }

    function register(token, userData) {
        initRunning.current = false;
        setToken(token);
        setAuthError(null);
        setIsReconnecting(false);
        setLoading(false);
        connectSocket();
        setUser({ ...userData, online: true });
        queryClient.setQueryData(['presence'], (old = {}) => ({
            ...old,
            [userData.id]: { online: true, status: userData.status || 'online' }
        }));
    }

    return (
        <AuthContext.Provider value={{
            user, setUser, login, register, logout,
            loading, authError, retryCount, isReconnecting, retry,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
