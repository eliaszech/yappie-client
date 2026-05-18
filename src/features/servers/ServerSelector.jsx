import { NavLink } from "react-router-dom";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus, faCompass, faDownload } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useQuery} from "@tanstack/react-query";
import {useAuth} from "../../hooks/useAuth.js";
import {fetchConversations, fetchServers} from "../../services/api.js";
import {useState} from "react";
import CreateServerDialog from "./dialogs/CreateServerDialog.jsx";
import {useServerUnread} from "../../hooks/useReadStates.js";
import YappieLogo from "../components/YappieLogo.jsx";

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

function UnreadConversationLink({ conversation, user }) {
    const others = conversation.participants.filter(p => p.user.id !== user.id);
    const first = others[0]?.user;
    const title = others.map(p => p.user.displayName ?? p.user.username).join(', ');
    const icon = (first?.username ?? '?').charAt(0).toUpperCase();
    const badge = conversation.unreadCount > 99 ? '99+' : conversation.unreadCount;

    return (
        <NavLink
            to={`/@me/messages/${conversation.id}`}
            title={title}
            className={({isActive}) => `relative group/dm w-12 h-12 rounded-2xl overflow-visible flex items-center justify-center transition-all duration-200 ${
                isActive ? 'ring-2 ring-primary' : ''
            }`}
        >
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-card flex items-center justify-center">
                {first?.avatar ? (
                    <img src={first.avatar} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xl text-primary-foreground bg-primary w-full h-full flex items-center justify-center">{icon}</span>
                )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-dnd text-white text-[10px] font-bold flex items-center justify-center border-2 border-guild-bar">
                {badge}
            </span>
        </NavLink>
    );
}

function ServerLink({ server }) {
    const { hasUnread, mentionCount } = useServerUnread(server.id);
    const badge = mentionCount > 99 ? '99+' : mentionCount;

    return (
        <NavLink to={`/servers/${server.id}`} title={server.name}
                 className={({isActive}) => `${isActive ? 'text-primary-foreground bg-primary' : 'text-muted-foreground bg-card'} relative group/srv w-12 h-12 rounded-2xl text-xl flex items-center hover:rounded-2xl hover:bg-primary hover:text-primary-foreground justify-center transition-all duration-200 overflow-visible`}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center">
                {server.icon ? (
                    <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                ) : (
                    server.name.charAt(0).toUpperCase()
                )}
            </div>
            {hasUnread && mentionCount === 0 && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r-full bg-foreground" />
            )}
            {mentionCount > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-dnd text-white text-[10px] font-bold flex items-center justify-center border-2 border-guild-bar">
                    {badge}
                </span>
            )}
        </NavLink>
    );
}

function ServerSelector() {
    const { user } = useAuth();
    const [showCreateServerDialog, setShowCreateServerDialog] = useState(false);

    const {data: servers = [] , isError, isLoading} = useQuery({
        queryKey: ['servers'],
        queryFn: fetchServers,
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    const { data: conversations = [] } = useQuery({
        queryKey: ['conversations', user?.id],
        queryFn: () => fetchConversations(user.id),
        staleTime: 10 * 60 * 1000,
        enabled: !!user?.id,
    });

    const unreadConversations = conversations.filter(c => c.unreadCount > 0);

    return (
        <div className="flex flex-col h-full shrink-0 grow w-20 pt-4 gap-2 items-center bg-guild-bar text-foreground pb-[65px]">
            <NavLink to="/@me" title="Yappie"
                     className={({isActive}) => `${isActive ? 'ring-2 ring-primary' : ''} group w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-card hover:bg-primary/10 text-primary transition-all duration-200`}>
                <YappieLogo className="w-7 h-7 transition-transform duration-200 group-hover:scale-110" />
            </NavLink>
            {unreadConversations.length > 0 && (
                <>
                    <div className="w-8 h-px bg-border mb-1"></div>
                    {unreadConversations.map(c => (
                        <UnreadConversationLink key={c.id} conversation={c} user={user} />
                    ))}
                </>
            )}
            {servers.length > 0 && (
                <div className="w-8 h-px bg-border mb-1"></div>
            )}
            {servers.length > 0 && servers.map((server) => (
                <ServerLink key={server.id} server={server} />
            ))}

            <div className="w-8 h-px bg-border mb-1"></div>
            <button onClick={() => setShowCreateServerDialog(true)}
                className={`text-muted-foreground bg-card w-12 h-12 cursor-pointer rounded-2xl text-lg hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all`} title="Discover">
                <FontAwesomeIcon icon={faPlus}/>
            </button>
            <NavLink to="/discover"
                     className={({isActive}) => `${isActive ? 'text-foreground bg-primary/80' : 'bg-card text-muted-foreground'} w-12 h-12 rounded-2xl text-xl  hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all`}>
                <FontAwesomeIcon icon={faCompass}/>
            </NavLink>
            {!isElectron && (
                <a href="https://github.com/eliaszech/yappie-client/releases/latest/download/Yappie-Setup.exe"
                   title="Desktop-App herunterladen"
                   className="text-muted-foreground bg-card w-12 h-12 rounded-2xl text-xl hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                    <FontAwesomeIcon icon={faDownload}/>
                </a>
            )}
            {showCreateServerDialog && (
                <CreateServerDialog onCancel={() => setShowCreateServerDialog(false)} />
            )}
        </div>
    )
}

export default ServerSelector