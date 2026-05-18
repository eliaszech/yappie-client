import {useUserPopup} from "../../../hooks/user/useUserPopup.js";
import {useEffect, useRef, useState} from "react";
import {useIsOnline, useUserStatus} from "../../../hooks/usePresence.js";
import {useUserActivity, useActivityPlaytime} from "../../../hooks/useActivity.js";
import UserAvatar from "../UserAvatar.jsx";
import {useAuth} from "../../../hooks/useAuth.js";
import Dropdown from "../Dropdown.jsx";
import StatusPicker from "./StatusPicker.jsx";
import StatusText from "./StatusText.jsx";
import {getSocket} from "../../../services/socket.js";
import {
    fetchOrCreateConversationWith,
    fetchFriends,
    fetchServers,
    sendFriendRequest,
    denyFriendRequest,
    acceptFriendRequest,
    createInvite,
} from "../../../services/api.js";
import {useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPen, faMessage, faUserCheck, faUserMinus, faBan, faGamepad} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {
    faEllipsis,
    faChevronRight,
    faChevronLeft,
    faLink,
    faGamepadModern
} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faUserPlus, faUserClock} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useSettings} from "../../../context/SettingsContext.jsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";

function UserPopup() {
    const { popup, closePopup } = useUserPopup();
    const { user } = useAuth();
    const { openSettings } = useSettings();
    const [input, setInput] = useState('');
    const [showMore, setShowMore] = useState(false);
    const [moreView, setMoreView] = useState('main');
    const ref = useRef(null);
    const moreRef = useRef(null);
    const isSelf = user.id === popup.user.id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const online = useIsOnline(popup.user.id) ?? popup.user.online;
    const status = useUserStatus(popup.user.id) ?? popup.user.status;
    const activity = useUserActivity(popup.user.id);
    const showActivity = online && activity?.name;
    const playtimeLabel = useActivityPlaytime(activity?.since);

    const { data: friends = [] } = useQuery({
        queryKey: ['friends'],
        queryFn: fetchFriends,
        staleTime: 10 * 60 * 1000,
        enabled: !isSelf,
    });

    const { data: servers = [] } = useQuery({
        queryKey: ['servers'],
        queryFn: fetchServers,
        staleTime: 10 * 60 * 1000,
        enabled: !isSelf && showMore && moreView === 'servers',
    });

    const friendship = friends.find(f => f.id === popup.user.id);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                closePopup();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [closePopup]);

    useEffect(() => {
        if (!showMore) return;
        function handleClick(e) {
            if (moreRef.current && !moreRef.current.contains(e.target)) {
                setShowMore(false);
                setMoreView('main');
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showMore]);

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

    async function handleFriendClick() {
        const socket = getSocket();
        if (!socket) return;

        if (!friendship) {
            const res = await sendFriendRequest(user.id, popup.user.id);
            if (!res.error) {
                queryClient.setQueryData(['friends'], old => old ? [...old, res] : [res]);
                socket.emit('friend:request', user.id, popup.user.id);
            }
        } else if (friendship.friendStatus === 'PENDING' && !friendship.isSender) {
            const res = await acceptFriendRequest(friendship.friendId, popup.user.id);
            if (!res.error) {
                queryClient.setQueryData(['friends'], old =>
                    old ? old.map(f => f.friendId === friendship.friendId ? {...f, friendStatus: 'ACCEPTED'} : f) : old
                );
                socket.emit('friend:accept', friendship.friendId, popup.user.id);
            }
        }
    }

    async function handleRemoveFriend() {
        const socket = getSocket();
        if (!socket) return;
        const res = await denyFriendRequest(friendship.friendId, popup.user.id);
        if (!res.error) {
            queryClient.setQueryData(['friends'], old =>
                old ? old.filter(f => f.friendId !== friendship.friendId) : old
            );
            socket.emit('friend:decline', friendship.friendId, popup.user.id);
        }
        setShowMore(false);
        setMoreView('main');
    }

    async function handleOpenDm() {
        const conversation = await fetchOrCreateConversationWith(popup.user.id);
        if (!conversation.error) {
            navigate(`/@me/messages/${conversation.id}`);
            closePopup();
        }
    }

    async function handleServerInvite(server) {
        const invite = await createInvite(server.id);
        const conversation = await fetchOrCreateConversationWith(popup.user.id);
        if (!invite.error && !conversation.error) {
            const socket = getSocket();
            if (!socket) return;
            socket.emit('message:send', {
                text: 'yappie.ch/invite/' + invite.code,
                type: 'conversation',
                roomId: conversation.id,
                messageType: 'server_invite',
                inviteId: invite.id,
            });
            navigate(`/@me/messages/${conversation.id}`);
            closePopup();
        }
    }

    let friendIcon = faUserPlus;
    let friendIconClass = 'text-muted-foreground hover:text-foreground';
    let friendTitle = 'Als Freund hinzufügen';
    let friendClickable = true;

    if (friendship) {
        if (friendship.friendStatus === 'ACCEPTED') {
            friendIcon = faUserCheck;
            friendIconClass = 'text-green-400';
            friendTitle = 'Befreundet';
            friendClickable = false;
        } else if (friendship.friendStatus === 'PENDING' && friendship.isSender) {
            friendIcon = faUserClock;
            friendIconClass = 'text-yellow-400';
            friendTitle = 'Freundschaftsanfrage ausstehend';
            friendClickable = false;
        } else if (friendship.friendStatus === 'PENDING' && !friendship.isSender) {
            friendIcon = faUserCheck;
            friendIconClass = 'text-blue-400 hover:text-blue-300';
            friendTitle = 'Freundschaftsanfrage annehmen';
            friendClickable = true;
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

    if (popup.orientation === 'left' || popup.position.left + 320 > window.innerWidth) {
        style.left = popup.position.left - popup.elementWidth - 320 - 16;
    }

    if (popup.orientation !== 'top' && popup.position.top + 280 > window.innerHeight) {
        style.top = window.innerHeight - 280 - 16;
    }

    return (
        <>
            <div className="fixed inset-0 z-49 pointer-events-auto" onClick={closePopup} />
            <div ref={ref}
                 className="fixed z-50 w-80 bg-card border border-border/60 rounded-xl shadow-2xl"
                 style={style}>
                {/* Banner with primary→accent gradient + radial highlight */}
                <div
                    className="relative h-20 rounded-t-xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.55) 0%, transparent 55%)',
                        }}
                    />
                    {!isSelf && (
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                            <button
                                onClick={friendClickable ? handleFriendClick : undefined}
                                title={friendTitle}
                                className={`w-8 h-8 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-md border border-white/15 transition-colors text-sm ${friendClickable ? 'cursor-pointer hover:bg-black/55' : 'cursor-default'}`}
                            >
                                <FontAwesomeIcon icon={friendIcon} className={friendIconClass} />
                            </button>

                            <div className="relative" ref={moreRef}>
                                <button
                                    onClick={() => { setShowMore(v => !v); setMoreView('main'); }}
                                    title="Mehr Optionen"
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-md border border-white/15 hover:bg-black/55 cursor-pointer transition-colors text-sm"
                                >
                                    <FontAwesomeIcon icon={faEllipsis} className="text-white/90" />
                                </button>

                                {showMore && (
                                    <div className="absolute right-0 top-full mt-1 w-52 bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl z-[60] py-1">
                                        {moreView === 'main' ? (
                                            <>
                                                <button
                                                    onClick={handleOpenDm}
                                                    className="w-full flex items-center cursor-pointer gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faMessage} className="w-4 text-center text-muted-foreground" />
                                                    Nachricht senden
                                                </button>
                                                <button
                                                    onClick={() => setMoreView('servers')}
                                                    className="w-full flex items-center cursor-pointer gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faLink} className="w-4 text-center text-muted-foreground" />
                                                    Zu Server einladen
                                                    <FontAwesomeIcon icon={faChevronRight} className="ml-auto text-xs text-muted-foreground" />
                                                </button>
                                                <div className="border-t border-border my-1" />
                                                <button
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-not-allowed opacity-50"
                                                    disabled
                                                    title="Kommt bald"
                                                >
                                                    <FontAwesomeIcon icon={faBan} className="w-4 text-center" />
                                                    Benutzer blockieren
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setMoreView('main')}
                                                    className="w-full flex items-center cursor-pointer gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                                                >
                                                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                                                    Server auswählen
                                                </button>
                                                <div className="border-t border-border my-1" />
                                                {servers.length === 0 ? (
                                                    <div className="px-3 py-2 text-xs text-muted-foreground">Keine Server</div>
                                                ) : servers.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleServerInvite(s)}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                                                            {s.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="truncate">{s.name}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="px-4 -mt-10 relative z-10">
                    <UserAvatar size="w-20 h-20 text-3xl border-4 border-card shadow-xl"
                        onlineSize="w-5 h-5 bottom-0.5 right-0.5" icon={popup.user.username.charAt(0).toUpperCase()}
                        avatar={popup.user.avatar} online={online} status={status}
                    />
                </div>

                {/* User Info */}
                <div className="px-4 pb-4 pt-2">
                    <div className="text-xl font-bold text-foreground leading-tight">{popup.user.displayName ?? popup.user.username}</div>
                    <div className="text-sm text-muted-foreground">{popup.user.username}</div>

                    {showActivity && (
                        <div
                            className="mt-4 p-3 rounded-xl border border-primary/25 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18) 0%, hsl(var(--accent) / 0.10) 100%)' }}
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Aktivität
                            </span>
                            <div className="mt-2 flex items-center gap-3">
                                {activity.icon ? (
                                    <img src={activity.icon} alt="" className="w-11 h-11 shrink-0 rounded-lg object-cover ring-1 ring-primary/30" />
                                ) : (
                                    <div className="w-11 h-11 shrink-0 rounded-lg bg-primary/25 text-primary flex items-center justify-center">
                                        <FontAwesomeIcon icon={faGamepad} className="text-base" />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-semibold text-foreground truncate" title={activity.name}>{activity.name}</span>
                                    {playtimeLabel && (
                                        <div className="flex items-center gap-1 text-primary">
                                            <FontAwesomeIcon className="text-xs" icon={faGamepadModern} />
                                            <span className="text-[11px] text-primary truncate">{playtimeLabel}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-3 rounded-xl bg-card/55 backdrop-blur-sm border border-border/60">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mitglied seit</span>
                        <p className="text-sm text-foreground mt-1">
                            {new Date(popup.user.createdAt).toLocaleDateString('de-DE', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                    {popup.roles?.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-card/55 backdrop-blur-sm border border-border/60">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Rollen
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {popup.roles.map(r => {
                                    const role = r.role ?? r;
                                    return (
                                        <span
                                            key={role.id}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                                            style={{
                                                background: `${role.color || '#99aab5'}1F`,
                                                color: role.color || '#99aab5',
                                                borderColor: `${role.color || '#99aab5'}55`,
                                            }}
                                        >
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: role.color || '#99aab5' }} />
                                            {role.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {isSelf && popup.isProfilePopup && (
                        <div className="flex flex-col mt-4 rounded-xl bg-card/55 backdrop-blur-sm border border-border/60 text-foreground divide-y divide-border/60">
                            <button
                                onClick={() => { closePopup(); openSettings('profile'); }}
                                className="cursor-pointer text-left px-3 py-3 w-full hover:bg-muted/40 text-sm font-medium transition-colors"
                            >
                                <FontAwesomeIcon icon={faPen} className="mr-3 text-muted-foreground" />
                                Profil bearbeiten
                            </button>
                            <Dropdown offset="4" trigger={
                                <button className="cursor-pointer text-left px-3 py-3 w-full hover:bg-muted/40 text-sm font-medium transition-colors">
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
                                   className="w-full px-3 py-2 text-sm rounded-lg bg-card/55 backdrop-blur-sm border border-border/60 outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent text-foreground placeholder:text-muted-foreground! transition-all"/>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserPopup;
