import {useUserPopup} from "../../../hooks/user/useUserPopup.js";
import {useEffect, useRef} from "react";
import {useIsOnline} from "../../../hooks/usePresence.js";
import UserAvatar from "../UserAvatar.jsx";

function UserPopup() {
    const { popup, closePopup } = useUserPopup();
    const ref = useRef(null);
    const isOnline = useIsOnline(popup.user.id)
    const online = isOnline !== undefined ? isOnline : popup.user.online;

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                closePopup();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [closePopup]);

    const style = {
        top: popup.position.top,
        left: popup.position.left,
    };

    // Wenn zu weit rechts, links vom Element anzeigen
    if (popup.position.left + 300 > window.innerWidth) {
        style.left = popup.position.left - 300 - 16;
    }

    // Wenn zu weit unten, nach oben verschieben
    if (popup.position.top + 280 > window.innerHeight) {
        style.top = window.innerHeight - 280 - 16;
    }

    return (
        <div ref={ref}
            className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
            style={style}>
            {/* Banner */}
            <div className="h-16 bg-primary" />

            {/* Avatar */}
            <div className="px-4 -mt-8">
                <UserAvatar size="w-16 h-16 text-2xl border-4 border-card"
                    onlineSize="w-5 h-5 bottom-0 right-0" icon={popup.user.username.charAt(0).toUpperCase()} online={online}  />
            </div>

            {/* User Info */}
            <div className="p-4">
                <div className="text-xl font-bold text-foreground">{popup.user.username}</div>
                <div className="text-sm text-muted-foreground">{popup.user.id}</div>

                <div className="mt-2">
                    <span className="text-xs font-semibold text-foreground">Mitglied seit</span>
                    <p className="text-xs text-muted-foreground mt-1">
                        {new Date(popup.user.createdAt).toLocaleDateString('de-DE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>

                <div className="mt-4">
                    <input placeholder="Nachricht senden..."
                        className="w-full px-3 py-2 text-sm rounded bg-input border border-border outline-none focus:ring-2 focus:ring-primary/80 text-foreground placeholder:text-muted-foreground!"/>
                </div>
            </div>
        </div>
    );
}

export default UserPopup;