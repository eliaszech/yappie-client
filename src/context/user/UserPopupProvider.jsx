import { useState, useMemo, useCallback } from 'react';
import { UserPopupContext } from './UserPopupContext';
import UserPopup from "../../features/components/user/UserPopup.jsx";

export function UserPopupProvider({children}) {
    const [popup, setPopup] = useState(null);

    const openPopup = useCallback((user, isProfilePopup, element, orientation, roles = null, serverId = null) => {
        const rect = element.getBoundingClientRect();

        setPopup({
            user,
            isProfilePopup,
            orientation,
            roles,
            serverId,
            elementWidth: rect.width,
            elementHeight: rect.height,
            position: {
                top: rect.top,
                left: rect.right + 8,
            }
        });
    }, []);

    const closePopup = useCallback(() => setPopup(null), []);

    const value = useMemo(() => ({ popup, openPopup, closePopup }), [popup]);

    return (
        <UserPopupContext.Provider value={value}>
            {children}
            {popup && <UserPopup />}
        </UserPopupContext.Provider>
    )
}