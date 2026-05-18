import { useState, useMemo, useCallback } from 'react';
import { ProfileModalContext } from './ProfileModalContext.jsx';
import ProfileModal from '../../features/components/user/ProfileModal.jsx';

export function ProfileModalProvider({ children }) {
    const [userId, setUserId] = useState(null);

    const openProfile = useCallback((id) => setUserId(id), []);
    const closeProfile = useCallback(() => setUserId(null), []);

    const value = useMemo(() => ({ userId, openProfile, closeProfile }), [userId, openProfile, closeProfile]);

    return (
        <ProfileModalContext.Provider value={value}>
            {children}
            {userId && <ProfileModal userId={userId} />}
        </ProfileModalContext.Provider>
    );
}
