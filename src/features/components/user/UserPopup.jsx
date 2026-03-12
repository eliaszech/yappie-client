import {useUserPopup} from "../../../hooks/user/useUserPopup.js";
import {useEffect, useRef} from "react";
import {useIsOnline} from "../../../hooks/usePresence.js";

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
    if (popup.position.top + 400 > window.innerHeight) {
        style.top = window.innerHeight - 400 - 16;
    }

    return (
        <div ref={ref}
            className="fixed z-50 w-72 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
            style={style}>
            {/* Banner */}
            <div className="h-16 bg-primary" />

            {/* Avatar */}
            <div className="px-4 -mt-8">
                <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-primary border-4 border-card flex items-center justify-center text-xl text-primary-foreground font-bold">
                        {popup.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${online ? 'bg-online' : 'bg-offline'}`} />
                </div>
            </div>

            {/* User Info */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-foreground">{popup.user.username}</h3>
                <span className="text-xs text-muted-foreground">{popup.user.email}</span>

                <div className="border-t border-border mt-3 pt-3">
                    <span className="text-xs font-semibold uppercase text-foreground">Mitglied seit</span>
                    <p className="text-xs text-muted-foreground mt-1">
                        {new Date(popup.user.createdAt).toLocaleDateString('de-DE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>

                <div className="mt-3">
                    <input
                        placeholder="Nachricht senden..."
                        className="w-full px-3 py-1.5 text-sm rounded bg-input border border-border outline-none focus:ring-2 focus:ring-primary/80 text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>
        </div>
    );
}

export default UserPopup;