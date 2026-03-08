import { useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../services/api';
import {AuthContext} from "./AuthContext.jsx";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => !!getToken());

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        fetch('http://localhost:3000/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => setUser(data.user))
            .catch(() => removeToken())
            .finally(() => setLoading(false));
    }, []);

    function login(token, userData) {
        setToken(token);
        setUser(userData);
    }

    function logout() {
        removeToken();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}