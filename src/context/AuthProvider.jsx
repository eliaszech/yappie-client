import { useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../services/api';
import { connectSocket, disconnectSocket, onPresenceChange } from '../services/socket';
import {AuthContext} from "./AuthContext.jsx";
import {useQueryClient} from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => !!getToken());
    const [error, setError] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const token = getToken();
        if (!token || user) return;

        fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if(!res.ok) throw new Error(res.status.toString());
                return res.json()
            })
            .then(data => {
                connectSocket();
                setUser({...data.user, online: true})
                queryClient.setQueryData(['presence'], (old = {}) => ({
                    ...old,
                    [data.id]: { online: true, status: data.status || 'online' }
                }));
            })
            .catch(e => {
                if(e.message === '404') {
                    removeToken();
                    return;
                }
                setError(true);
                setLoading(false);
            })
            .finally(() => setLoading(false));
    }, []);

    function login(token, userData) {
        setToken(token);
        connectSocket();
        setUser({...userData, online: true});
        queryClient.setQueryData(['presence'], (old = {}) => ({
            ...old,
            [userData.id]: { online: true, status: userData.status || 'online' }
        }));
    }

    function logout() {
        disconnectSocket();
        removeToken();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}