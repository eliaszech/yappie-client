import {useUserPopup} from "../../../hooks/user/useUserPopup.js";
import {useEffect, useRef, useState} from "react";
import {useIsOnline, useUserStatus} from "../../../hooks/usePresence.js";
import UserAvatar from "../UserAvatar.jsx";
import {useAuth} from "../../../hooks/useAuth.js";
import Dropdown from "../Dropdown.jsx";
import StatusPicker from "./StatusPicker.jsx";
import StatusText from "./StatusText.jsx";
import {getSocket} from "../../../services/socket.js";
import {fetchOrCreateConversationWith} from "../../../services/api.js";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

function UserPopup() {
    const { popup, closePopup } = useUserPopup();
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const ref = useRef(null);
    const isSelf = user.id === popup.user.id;
    const navigate = useNavigate();

    const online = useIsOnline(popup.user.id) ?? popup.user.online;
    const status = useUserStatus(popup.user.id) ?? popup.user.status;

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                closePopup();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [closePopup]);

    async function sendMessage() {
        const socket = getSocket();
        if (!socket) return;

        if(input.trim() === '') return;

        const conversation = await fetchOrCreateConversationWith(popup.user.id);

        if(!conversation.error) {
            socket.emit('message:send', {
                type: 'conversation',
                roomId: conversation.id,
                text: input,
            });

            navigate(`/@me/messages/${conversation.id}`);
            closePopup();
        } else {
            alert('Konnte Nachricht nicht senden');
        }
    }

    const style = {
        top: popup.position.top,
        left: popup.position.left,
    };

    if(popup.orientation === 'top') {
        style.bottom = popup.elementHeight + 25;
        style.left = style.left - popup.elementWidth - 10;
        style.top = 'auto'
    }

    // Wenn zu weit rechts, links vom Element anzeigen
    if (popup.orientation === 'left' || popup.position.left + 320 > window.innerWidth) {
        style.left = popup.position.left - popup.elementWidth - 320 - 16;
    }

    // Wenn zu weit unten, nach oben verschieben
    if (popup.orientation !== 'top' && popup.position.top + 280 > window.innerHeight) {
        style.top = window.innerHeight - 280 - 16;
    }

    return (
        <>
            <div className="fixed inset-0 z-49 pointer-events-auto" onClick={closePopup} />
            <div ref={ref}
                 className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-xl"
                 style={style}>
                {/* Banner */}
                <div className="h-16 bg-primary rounded-lg" />

                {/* Avatar */}
                <div className="px-4 -mt-8">
                    <UserAvatar size="w-16 h-16 text-2xl border-4 border-card"
                        onlineSize="w-5 h-5 bottom-0 right-0" icon={popup.user.username.charAt(0).toUpperCase()}
                        online={online} status={status}
                    />
                </div>

                {/* User Info */}
                <div className="p-4">
                    <div className="text-xl font-bold text-foreground">{popup.user.displayName ?? popup.user.username}</div>
                    <div className="text-sm text-muted-foreground">{popup.user.username}</div>

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

                    {isSelf && popup.isProfilePopup && (
                        <div className="mt-4 rounded-lg bg-muted text-foreground">
                            <Dropdown offset="4" trigger={
                                <button className="rounded-lg cursor-pointer text-left px-3 py-3 w-full hover:bg-card/50 text-sm font-medium">
                                    <StatusText online={online} userStatus={ status } showRealStatus={true} />
                                </button>
                            } content={
                                <StatusPicker />
                            } position="rightBottom" />
                        </div>
                    )}

                    {!isSelf && (
                        <div className="mt-4">
                            <input placeholder="Nachricht senden..."
                                   onKeyDown={async (e) => {
                                       if (e.key === 'Enter') {
                                           await sendMessage();
                                       }
                                   }}
                                   onChange={(e) => setInput(e.target.value)}
                                   className="w-full px-3 py-2 text-sm rounded bg-input border border-border outline-none focus:ring-2 focus:ring-primary/80 text-foreground placeholder:text-muted-foreground!"/>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserPopup;