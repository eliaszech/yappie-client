import {NavLink, useLocation} from "react-router-dom";
import {faAward, faPlus, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";
import {useLastPath} from "../../hooks/useLastPath.js";
import {useEffect} from "react";
import {useQuery} from "@tanstack/react-query";
import {fetchConversations} from "../../services/api.js";
import UserAvatar from "../components/UserAvatar.jsx";

function MessagesSidebar() {
    const {t} = useTranslation();
    const location = useLocation();
    const { savePath } = useLastPath('messages')

    const { data: conversations = [], isLoading, isError} = useQuery({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    useEffect(() => {
        savePath(location.pathname);
    }, [location.pathname]);

    return(
        <div className="max-w-xs w-full shrink-0 bg-card rounded-tl-xl flex flex-col h-screen overflow-y-auto">
            <div className="px-3 h-12 flex items-center border-b-2 border-border">
                <a href="#findOrStart"
                   className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all bg-muted/50 hover:bg-muted text-foreground">
                    Find or start a conversation</a>
            </div>
            <div className="py-3 px-3 flex flex-col gap-1">
                <NavLink to="/@me/friends" className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-2 py-2 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faUsers} /> {t('messages.friends.title')}
                </NavLink>
                <NavLink to="/@me/quests" className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-2 py-2 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faAward} /> {t('messages.quests')}
                </NavLink>
            </div>
            <div className="h-px bg-border w-full"></div>
            <div className="flex flex-col px-3">
                <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                    <span className="uppercase">Direktnachrichten</span>
                    <button><FontAwesomeIcon icon={faPlus} /></button>
                </div>
                <div className="flex flex-col gap-1">
                    {conversations.map((conversation) => {
                        const conversationTitle = conversation.participants.map(participant => participant.user.username).join(', ');
                        return <NavLink to={`messages/${conversation.id}`} key={conversation.id}
                            className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all  hover:text-foreground hover:bg-muted/50`}>
                            <UserAvatar online={conversation.participants.length === 1 ? conversation.participants[0].user.online : null} icon={<FontAwesomeIcon icon={faUsers} />} />
                            <div className="flex flex-col">
                                <span className="text-sm">{conversationTitle}</span>
                                {conversation.messages[0] !== undefined ? (
                                    <span className="text-muted-foreground text-xs">{conversation.messages[0].text}</span>
                                ) : null}

                            </div>
                        </NavLink>
                    })}
                </div>
            </div>
        </div>
    )
}

export default MessagesSidebar;