import { useState, useMemo, useCallback } from 'react';
import { UserPopupContext } from './UserPopupContext';
import UserPopup from "../../features/components/user/UserPopup.jsx";

export function UserPopupProvider({children}) {
    const [popup, setPopup] = useState(null);

    const openPopup = useCallback((user, element) => {
        const rect = element.getBoundingClientRect();
        setPopup({
            user,
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